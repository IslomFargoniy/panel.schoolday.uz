<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\DailyAttendance;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Superadmin']);
    Carbon::setTestNow('2026-10-21 09:00:00');

    $makeSchool = function (string $name) {
        $school = School::create(['name' => $name, 'status' => 1]);
        $branch = Branch::create(['school_id' => $school->id, 'name' => "$name filial"]);
        $shift = Shift::create(['branch_id' => $branch->id, 'name' => '1-smena', 'start_time' => '08:00', 'end_time' => '13:00']);
        $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => "$name 5-A"]);
        $present = Student::create(['class_id' => $class->id, 'name' => "$name Ali", 'status' => 'active']);
        $absent = Student::create(['class_id' => $class->id, 'name' => "$name Vali", 'status' => 'active']);
        $attendance = DailyAttendance::create([
            'student_id' => $present->id,
            'date' => '2026-10-21',
            'first_check_in' => '2026-10-21 08:10:00',
            'is_late' => true,
        ]);

        return compact('school', 'branch', 'shift', 'class', 'present', 'absent', 'attendance');
    };

    $this->a = $makeSchool('A');
    $this->b = $makeSchool('B');

    $this->user = User::factory()->create(['email' => 'admin@a.uz', 'phone' => '+998901234567']);
    UserSchool::create(['user_id' => $this->user->id, 'school_id' => $this->a['school']->id]);
});

afterEach(fn () => Carbon::setTestNow());

function actAsSchoolAdmin(User $user): void
{
    Sanctum::actingAs($user, ['school']);
}

test('login returns a token by email and by phone', function () {
    $this->postJson('/api/v1/auth/login', ['login' => 'admin@a.uz', 'password' => 'password'])
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.user.schools.0.id', $this->a['school']->id)
        ->assertJsonStructure(['data' => ['token']]);

    $this->postJson('/api/v1/auth/login', ['login' => '90 123 45 67', 'password' => 'password'])
        ->assertOk();
});

test('login rejects a wrong password and a user without schools', function () {
    $this->postJson('/api/v1/auth/login', ['login' => 'admin@a.uz', 'password' => 'wrong'])
        ->assertUnauthorized()
        ->assertJsonPath('success', false);

    $lonely = User::factory()->create();
    $this->postJson('/api/v1/auth/login', ['login' => $lonely->email, 'password' => 'password'])
        ->assertForbidden();
});

test('login asks for the two factor code when 2FA is enabled', function () {
    $this->user->forceFill([
        'two_factor_secret' => encrypt('SECRETSECRETSECR'),
        'two_factor_recovery_codes' => encrypt(json_encode(['recovery-one'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $this->postJson('/api/v1/auth/login', ['login' => 'admin@a.uz', 'password' => 'password'])
        ->assertStatus(422)
        ->assertJsonPath('two_factor_required', true);

    $this->postJson('/api/v1/auth/login', ['login' => 'admin@a.uz', 'password' => 'password', 'recovery_code' => 'recovery-one'])
        ->assertOk();
});

test('api requires a token with the school ability', function () {
    $this->getJson('/api/v1/dashboard')->assertUnauthorized();

    Sanctum::actingAs($this->user, ['other']);
    $this->getJson('/api/v1/dashboard')->assertForbidden();
});

test('logout revokes the token', function () {
    $token = $this->user->createToken('android', ['school'])->plainTextToken;

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();

    expect($this->user->tokens()->count())->toBe(0);
});

test('dashboard counts only the users schools', function () {
    actAsSchoolAdmin($this->user);

    $this->getJson('/api/v1/dashboard')
        ->assertOk()
        ->assertJsonPath('data.stats.total_students', 2)
        ->assertJsonPath('data.stats.present', 1)
        ->assertJsonPath('data.stats.late', 1)
        ->assertJsonPath('data.stats.absent', 1)
        ->assertJsonCount(7, 'data.trend');

    // Boshqa maktab filtri bo'sh natija beradi
    $this->getJson('/api/v1/dashboard?school_id=' . $this->b['school']->id)
        ->assertOk()
        ->assertJsonPath('data.stats.total_students', 0);
});

test('filters and monitoring show only the users schools', function () {
    actAsSchoolAdmin($this->user);

    $this->getJson('/api/v1/filters')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.branches.0.shifts.0.classes.0.id', $this->a['class']->id);

    $this->getJson('/api/v1/monitoring')
        ->assertOk()
        ->assertJsonCount(1, 'data.branches')
        ->assertJsonPath('data.branches.0.present', 1)
        ->assertJsonPath('data.branches.0.classes.0.students.0.status', 'late')
        ->assertJsonPath('data.branches.0.classes.0.students.1.status', 'absent');
});

test('lists are scoped to the users schools', function () {
    actAsSchoolAdmin($this->user);
    BranchDevice::create(['branch_id' => $this->a['branch']->id, 'name' => 'A kirish', 'device_id' => 'dev-a']);
    BranchDevice::create(['branch_id' => $this->b['branch']->id, 'name' => 'B kirish', 'device_id' => 'dev-b']);

    $this->getJson('/api/v1/students')->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('meta.total', 2);
    $this->getJson('/api/v1/students?search=Vali')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/v1/classes')->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.present_students', 1)
        ->assertJsonPath('data.0.late_students', 1);
    $this->getJson('/api/v1/devices')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'A kirish');
    $this->getJson('/api/v1/reports')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.status', 'late');
    $this->getJson('/api/v1/reports?status=absent')->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.student.id', $this->a['absent']->id);
});

test('records of another school are forbidden', function () {
    actAsSchoolAdmin($this->user);

    $this->getJson('/api/v1/students/' . $this->a['present']->id)->assertOk()
        ->assertJsonPath('data.summary.present', 1);
    $this->getJson('/api/v1/classes/' . $this->a['class']->id)->assertOk()->assertJsonCount(2, 'data.students');
    $this->getJson('/api/v1/reports/' . $this->a['attendance']->id)->assertOk();

    $this->getJson('/api/v1/students/' . $this->b['present']->id)->assertForbidden();
    $this->getJson('/api/v1/students/' . $this->b['present']->id . '/events')->assertForbidden();
    $this->getJson('/api/v1/classes/' . $this->b['class']->id)->assertForbidden();
    $this->getJson('/api/v1/reports/' . $this->b['attendance']->id)->assertForbidden();
});

test('global admin sees every school', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Admin');
    actAsSchoolAdmin($admin);

    $this->getJson('/api/v1/filters')->assertOk()->assertJsonCount(2, 'data');
    $this->getJson('/api/v1/students')->assertOk()->assertJsonPath('meta.total', 4);
});

test('inactive school blocks data endpoints but not the profile', function () {
    $this->a['school']->update(['status' => 0]);
    actAsSchoolAdmin($this->user);

    $this->getJson('/api/v1/dashboard')->assertForbidden()->assertJsonPath('error', 'school_inactive');
    $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.schools.0.is_active', false);
});
