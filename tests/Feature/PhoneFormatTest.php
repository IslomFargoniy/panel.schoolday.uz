<?php

use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Illuminate\Support\Facades\Bus;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Bus::fake();
    Role::firstOrCreate(['name' => 'Superadmin']);
    $this->school = School::create(['name' => 'A', 'status' => 1, 'branch_limit' => 5]);
    $this->branch = Branch::create(['school_id' => $this->school->id, 'name' => 'Bino']);
    $shift = Shift::create(['branch_id' => $this->branch->id, 'name' => '1', 'start_time' => '08:00', 'end_time' => '13:00']);
    $this->class = SchoolClass::create(['shift_id' => $shift->id, 'name' => '5-A']);
    $this->admin = User::factory()->create(['phone' => null]);
    UserSchool::create(['user_id' => $this->admin->id, 'school_id' => $this->school->id]);
});

test('student phone is stored in one form from the web form', function () {
    $this->actingAs($this->admin)
        ->post(route('students.store'), ['name' => 'Ali', 'class_id' => $this->class->id, 'phone' => '90 123 45 67'])
        ->assertSessionHasNoErrors();

    expect(Student::first()->phone)->toBe('+998901234567');
});

test('a phone that is not a phone is refused', function () {
    $this->actingAs($this->admin)
        ->post(route('students.store'), ['name' => 'Ali', 'class_id' => $this->class->id, 'phone' => '12345'])
        ->assertSessionHasErrors('phone');
});

test('the same number in another spelling counts as taken', function () {
    $sa = User::factory()->create();
    $sa->assignRole('Superadmin');
    User::factory()->create(['phone' => '+998901234567']);

    $this->actingAs($sa)->post(route('users.store'), [
        'name' => 'X', 'email' => 'x@x.uz', 'password' => 'password123', 'role' => 'Superadmin', 'phone' => '90 123-45-67',
    ])->assertSessionHasErrors('phone');
});

test('web login accepts the phone in any spelling', function () {
    User::factory()->create(['email' => 'p@p.uz', 'phone' => '+998911112233']);

    $this->post(route('login.store'), ['email' => '91 111 22 33', 'password' => 'password'])->assertRedirect();
    $this->assertAuthenticated();
});

test('imported phones without the code are completed', function () {
    $s = Student::create(['class_id' => $this->class->id, 'name' => 'Import', 'phone' => '901112233']);

    expect($s->phone)->toBe('+998901112233');
});

test('searching students by a typed phone finds them', function () {
    Student::create(['class_id' => $this->class->id, 'name' => 'Vali', 'phone' => '+998935556677']);

    $this->actingAs($this->admin)->get(route('students.index', ['search' => '93 555 66']))
        ->assertInertia(fn ($page) => $page->where('students.total', 1));
});

test('device and branch MAC addresses are stored with colons', function () {
    $this->actingAs($this->admin)->post(route('branch_device.store'), [
        'branch_id' => $this->branch->id, 'connection_type' => 'http_listening', 'mac_address' => '88-de-39-32-d8-0f',
    ])->assertSessionHasNoErrors();
    expect($this->branch->devices()->first()->mac_address)->toBe('88:DE:39:32:D8:0F');

    $this->actingAs($this->admin)->post(route('branch_device.store'), [
        'branch_id' => $this->branch->id, 'connection_type' => 'http_listening', 'mac_address' => 'salom',
    ])->assertSessionHasErrors('mac_address');
});
