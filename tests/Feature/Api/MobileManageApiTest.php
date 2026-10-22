<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\DailyAttendance;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Setting;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Bus::fake();
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Superadmin']);

    $make = function (string $name) {
        $school = School::create(['name' => $name, 'status' => 1, 'branch_limit' => 2]);
        $branch = Branch::create(['school_id' => $school->id, 'name' => "$name filial"]);
        $shift = Shift::create(['branch_id' => $branch->id, 'name' => '1-smena', 'start_time' => '08:00', 'end_time' => '13:00']);
        $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => "$name 5-A"]);
        $student = Student::create(['class_id' => $class->id, 'name' => "$name Ali", 'status' => 'active']);

        return compact('school', 'branch', 'shift', 'class', 'student');
    };
    $this->a = $make('A');
    $this->b = $make('B');

    $this->schoolAdmin = User::factory()->create();
    UserSchool::create(['user_id' => $this->schoolAdmin->id, 'school_id' => $this->a['school']->id]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
    $this->superadmin = User::factory()->create();
    $this->superadmin->assignRole('Superadmin');
});

function actAs(User $user): void
{
    Sanctum::actingAs($user, ['school']);
}

// ---- School admin: own school only ----

test('school admin manages students of own school with a face photo', function () {
    Storage::fake('public');
    actAs($this->schoolAdmin);

    $id = $this->postJson('/api/v1/students', [
        'name' => 'Yangi O\'quvchi',
        'class_id' => $this->a['class']->id,
        'gender' => 'male',
        'face_image' => UploadedFile::fake()->image('face.jpg'),
    ])->assertCreated()->json('data.id');

    $student = Student::find($id);
    expect($student->face_image)->toStartWith('/storage/faces/');
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $student->face_image));

    $this->postJson("/api/v1/students/$id", ['name' => 'Tahrirlangan', 'class_id' => $this->a['class']->id, 'status' => 'inactive'])
        ->assertOk()
        ->assertJsonPath('data.status', 'inactive');
    // No new photo: the old one stays
    expect(Student::find($id)->face_image)->toBe($student->face_image);

    $this->getJson('/api/v1/students?status=all')->assertOk()->assertJsonPath('meta.total', 2);
    $this->deleteJson("/api/v1/students/$id")->assertOk();
    expect(Student::find($id))->toBeNull();
});

test('blank terminal fields fall back to the database defaults', function () {
    actAs($this->schoolAdmin);

    $id = $this->post('/api/v1/students', [
        'name' => 'Bo\'sh maydonlar', 'class_id' => $this->a['class']->id,
        'user_verify_mode' => '', 'door_right' => '', 'plan_template_no' => '', 'gender' => '',
    ], ['Accept' => 'application/json'])->assertCreated()->json('data.id');

    $s = Student::find($id);
    expect($s->user_verify_mode)->toBe('face');
    expect($s->door_right)->toBe('1');
});

test('school admin cannot touch another school', function () {
    actAs($this->schoolAdmin);

    $this->postJson('/api/v1/students', ['name' => 'X', 'class_id' => $this->b['class']->id])->assertForbidden();
    $this->postJson('/api/v1/students/' . $this->b['student']->id, ['name' => 'X', 'class_id' => $this->b['class']->id])->assertForbidden();
    $this->deleteJson('/api/v1/students/' . $this->b['student']->id)->assertForbidden();
    // Moving an own student into another school's class
    $this->postJson('/api/v1/students/' . $this->a['student']->id, ['name' => 'X', 'class_id' => $this->b['class']->id])->assertForbidden();

    $this->putJson('/api/v1/classes/' . $this->b['class']->id, ['name' => 'X', 'shift_id' => $this->b['shift']->id])->assertForbidden();
    $this->deleteJson('/api/v1/shifts/' . $this->b['shift']->id)->assertForbidden();
    $this->putJson('/api/v1/branches/' . $this->b['branch']->id, ['name' => 'X'])->assertForbidden();
    $this->getJson('/api/v1/branches/' . $this->b['branch']->id)->assertForbidden();
    $this->postJson('/api/v1/devices', ['branch_id' => $this->b['branch']->id, 'connection_type' => 'isup', 'device_id' => 'X1'])->assertForbidden();

    $att = DailyAttendance::create(['student_id' => $this->b['student']->id, 'date' => now()->toDateString(), 'is_late' => false]);
    $this->deleteJson("/api/v1/reports/{$att->id}")->assertForbidden();
});

test('classes, shifts and devices round trip', function () {
    actAs($this->schoolAdmin);

    $shiftId = $this->postJson('/api/v1/shifts', ['branch_id' => $this->a['branch']->id, 'name' => '2-smena', 'start_time' => '13:30', 'end_time' => '18:00'])
        ->assertCreated()->assertJsonPath('data.start_time', '13:30')->json('data.id');
    // A third shift in one branch is refused, as on the web
    $this->postJson('/api/v1/shifts', ['branch_id' => $this->a['branch']->id, 'name' => '3-smena', 'start_time' => '18:00', 'end_time' => '20:00'])
        ->assertUnprocessable()->assertJsonValidationErrors('branch_id');

    $classId = $this->postJson('/api/v1/classes', ['name' => '6-B', 'shift_id' => $shiftId, 'telegram_group_id' => '-100555'])
        ->assertCreated()->assertJsonPath('data.telegram_group_id', '-100555')->json('data.id');
    $this->putJson("/api/v1/classes/$classId", ['name' => '6-V', 'shift_id' => $shiftId])->assertOk()->assertJsonPath('data.name', '6-V');

    // A shift with classes can't go
    $this->deleteJson("/api/v1/shifts/$shiftId")->assertUnprocessable()->assertJsonPath('error', 'crud.delete_shift_error');
    $this->deleteJson("/api/v1/classes/$classId")->assertOk();
    $this->deleteJson("/api/v1/shifts/$shiftId")->assertOk();

    $deviceId = $this->postJson('/api/v1/devices', ['branch_id' => $this->a['branch']->id, 'connection_type' => 'isup', 'device_id' => 'DS-1', 'encryption_key' => 'secret-key'])
        ->assertCreated()->assertJsonPath('data.has_encryption_key', true)->assertJsonMissingPath('data.encryption_key')->json('data.id');
    // A blank key with keep_encryption_key keeps the stored one
    $this->putJson("/api/v1/devices/$deviceId", ['branch_id' => $this->a['branch']->id, 'connection_type' => 'isup', 'device_id' => 'DS-1', 'name' => 'Kirish', 'keep_encryption_key' => true])
        ->assertOk()->assertJsonPath('data.has_encryption_key', true);
    expect(BranchDevice::find($deviceId)->encryption_key)->toBe('secret-key');
    $this->deleteJson("/api/v1/devices/$deviceId")->assertOk();
});

test('branch limit and MAC list follow the web rules', function () {
    actAs($this->schoolAdmin);

    $id = $this->postJson('/api/v1/branches', ['name' => 'Ikkinchi bino', 'mac_addresses' => ['aa:bb:cc:dd:ee:ff']])
        ->assertCreated()->assertJsonPath('data.school_id', $this->a['school']->id)->json('data.id');
    $this->getJson("/api/v1/branches/$id")->assertOk()->assertJsonPath('data.mac_addresses.0', 'AA:BB:CC:DD:EE:FF');

    // Limit is 2 branches
    $this->postJson('/api/v1/branches', ['name' => 'Uchinchi'])
        ->assertUnprocessable()
        ->assertJsonPath('error', 'crud.branch_limit_reached')
        ->assertJsonPath('message', fn ($m) => str_contains($m, '2'));

    $this->deleteJson('/api/v1/branches/' . $this->a['branch']->id)->assertUnprocessable()->assertJsonPath('error', 'crud.branch_has_relations');
});

test('errors come in the app language', function () {
    actAs($this->schoolAdmin);
    Branch::create(['school_id' => $this->a['school']->id, 'name' => 'To\'la']);

    $this->postJson('/api/v1/branches', ['name' => 'Ortiqcha'], ['Accept-Language' => 'ru'])
        ->assertUnprocessable()
        ->assertJsonPath('message', fn ($m) => ! str_contains($m, 'Tanlangan maktab'));
});

test('report rows and events can be deleted', function () {
    actAs($this->schoolAdmin);
    $att = DailyAttendance::create(['student_id' => $this->a['student']->id, 'date' => now()->toDateString(), 'is_late' => false]);

    $this->deleteJson("/api/v1/reports/{$att->id}")->assertOk();
    expect(DailyAttendance::find($att->id))->toBeNull();
});

test('school admin cannot reach admin and superadmin endpoints', function () {
    actAs($this->schoolAdmin);

    $this->getJson('/api/v1/auth/me')->assertJsonPath('data.permissions.manage_schools', false);
    $this->getJson('/api/v1/schools')->assertOk()->assertJsonCount(1, 'data');
    $this->putJson('/api/v1/schools/' . $this->a['school']->id, ['name' => 'X', 'branch_limit' => 9])->assertForbidden();
    $this->postJson('/api/v1/schools', ['name' => 'X', 'branch_limit' => 1])->assertForbidden();
    $this->putJson('/api/v1/schools/' . $this->a['school']->id . '/settings', ['school_id' => $this->a['school']->id])->assertForbidden();
    $this->getJson('/api/v1/users/lookup?q=ab')->assertForbidden();
    $this->getJson('/api/v1/users')->assertForbidden();
    $this->getJson('/api/v1/system-settings')->assertForbidden();
});

// ---- Admin ----

test('admin manages schools, their settings and users', function () {
    actAs($this->admin);
    $this->getJson('/api/v1/auth/me')->assertJsonPath('data.permissions.manage_schools', true)->assertJsonPath('data.permissions.manage_users', false);

    $id = $this->postJson('/api/v1/schools', ['name' => 'Yangi maktab', 'branch_limit' => 3, 'status' => 1, 'valid_date' => '2027-01-01'])
        ->assertCreated()->json('data.id');
    // The creator is attached
    $this->getJson("/api/v1/schools/$id")->assertJsonPath('data.users.0.id', $this->admin->id);

    $this->putJson("/api/v1/schools/$id", ['name' => 'Nomi o\'zgardi', 'branch_limit' => 5])->assertOk()->assertJsonPath('data.branch_limit', 5);
    // The school in the URL wins over the body
    $this->putJson("/api/v1/schools/$id/settings", ['school_id' => $this->b['school']->id, 'timezone' => 'Asia/Tashkent'])
        ->assertOk()->assertJsonPath('data.settings.timezone', 'Asia/Tashkent');
    expect($this->b['school']->fresh()->school_setting)->toBeNull();

    $this->getJson('/api/v1/users/lookup?q=' . substr($this->schoolAdmin->email, 0, 5))->assertOk()->assertJsonPath('data.0.id', $this->schoolAdmin->id);
    $this->postJson("/api/v1/schools/$id/users", ['user_id' => $this->schoolAdmin->id])->assertOk()->assertJsonCount(2, 'data.users');
    $this->deleteJson("/api/v1/schools/$id/users/{$this->schoolAdmin->id}")->assertOk()->assertJsonCount(1, 'data.users');

    $this->deleteJson('/api/v1/schools/' . $this->a['school']->id)->assertUnprocessable()->assertJsonPath('error', 'crud.cannot_delete_school_with_data');
    $this->deleteJson("/api/v1/schools/$id")->assertOk();

    $this->getJson('/api/v1/users')->assertForbidden();
});

// ---- Superadmin ----

test('superadmin manages users and system settings', function () {
    actAs($this->superadmin);

    $this->getJson('/api/v1/roles')->assertOk()->assertJsonFragment(['Admin']);
    $id = $this->postJson('/api/v1/users', ['name' => 'Yangi', 'email' => 'yangi@school.uz', 'password' => 'password123', 'role' => 'Admin'])
        ->assertCreated()->assertJsonPath('data.role', 'Admin')->json('data.id');
    $this->putJson("/api/v1/users/$id", ['name' => 'Yangi 2', 'email' => 'yangi@school.uz', 'role' => 'Superadmin'])
        ->assertOk()->assertJsonPath('data.role', 'Superadmin');
    $this->deleteJson("/api/v1/users/{$this->superadmin->id}")->assertUnprocessable()->assertJsonPath('error', 'crud.cannot_delete_self');
    $this->deleteJson("/api/v1/users/$id")->assertOk();

    config(['services.telegram.webhook_secret' => null]);
    $this->putJson('/api/v1/system-settings', ['telegram_bot_token' => '123456:ABCDEFGHIJ'])
        ->assertUnprocessable()->assertJsonPath('error', 'settings.telegram_secret_missing');
    // Saved even so; only a masked form comes back
    expect(Setting::where('key', 'telegram_bot_token')->value('value'))->toBe('123456:ABCDEFGHIJ');
    $this->getJson('/api/v1/system-settings')->assertOk()
        ->assertJsonPath('data.telegram_bot_token_set', true)
        ->assertJsonPath('data.telegram_bot_token_masked', '123456…GHIJ');
});

// ---- Profile & 2FA ----

test('profile can be updated and deleted with the password', function () {
    actAs($this->schoolAdmin);

    $this->putJson('/api/v1/auth/profile', ['name' => 'Yangi ism', 'email' => 'new@mail.uz', 'phone' => '+998901234567'])
        ->assertOk()->assertJsonPath('data.name', 'Yangi ism');
    $this->deleteJson('/api/v1/auth/profile', ['password' => 'wrong'])->assertUnprocessable();
    $this->deleteJson('/api/v1/auth/profile', ['password' => 'password'])->assertOk();
    expect(User::find($this->schoolAdmin->id))->toBeNull();
});

test('two factor can be enabled, confirmed and disabled', function () {
    actAs($this->schoolAdmin);

    $this->postJson('/api/v1/auth/two-factor/enable', ['password' => 'wrong'])->assertUnprocessable()->assertJsonValidationErrors('password');
    $secret = $this->postJson('/api/v1/auth/two-factor/enable', ['password' => 'password'])
        ->assertOk()->assertJsonPath('data.otpauth_url', fn ($u) => str_starts_with($u, 'otpauth://'))->json('data.secret');

    $this->postJson('/api/v1/auth/two-factor/confirm', ['code' => '000000'])->assertUnprocessable();
    $code = app(PragmaRX\Google2FA\Google2FA::class)->getCurrentOtp($secret);
    $codes = $this->postJson('/api/v1/auth/two-factor/confirm', ['code' => $code])->assertOk()->json('data.recovery_codes');
    expect($codes)->toHaveCount(8);
    expect($this->schoolAdmin->fresh()->hasEnabledTwoFactorAuthentication())->toBeTrue();

    $this->postJson('/api/v1/auth/two-factor/recovery-codes/regenerate', ['password' => 'password'])->assertOk()->assertJsonCount(8, 'data.recovery_codes');
    $this->postJson('/api/v1/auth/two-factor/disable', ['password' => 'password'])->assertOk();
    expect($this->schoolAdmin->fresh()->hasEnabledTwoFactorAuthentication())->toBeFalse();
});

test('forgot password answers the same for unknown emails', function () {
    $this->postJson('/api/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
});

test('web panel still uses the shared rules', function () {
    $this->actingAs($this->schoolAdmin);
    Branch::create(['school_id' => $this->a['school']->id, 'name' => 'To\'la']);

    $this->post(route('branches.store'), ['name' => 'Ortiqcha'])
        ->assertRedirect()
        ->assertSessionHas('error', ['key' => 'crud.branch_limit_reached', 'params' => ['limit' => 2]]);
});
