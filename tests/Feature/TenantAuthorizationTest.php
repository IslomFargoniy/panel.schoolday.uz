<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'Superadmin']);
});

test('monitoring routes are redirected to login for guests', function () {
    $this->get(route('monitoring'))->assertRedirect(route('login'));
    $this->get(route('monitoring.data'))->assertRedirect(route('login'));
});

test('system settings is forbidden for non-superadmin users', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get(route('settings.system.index'))->assertForbidden();
    $this->post(route('settings.system.store'), [])->assertForbidden();
});

test('user without attached schools sees empty dashboard stats and lists', function () {
    $school = School::create(['name' => 'School A']);
    $branch = Branch::create(['school_id' => $school->id, 'name' => 'Branch A']);
    $shift = Shift::create(['branch_id' => $branch->id, 'name' => 'Shift 1', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => '5-A']);
    Student::create(['class_id' => $class->id, 'name' => 'Student 1', 'status' => 'active']);

    $userWithoutSchools = User::factory()->create();
    $this->actingAs($userWithoutSchools);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('stats.total_students', 0)
        ->where('schools', [])
        ->where('branches', [])
    );
});

test('user cannot view, update, or delete branch belonging to another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchA = Branch::create(['school_id' => $schoolA->id, 'name' => 'Branch A']);
    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    // Can access own branch
    $this->get(route('branches.show', $branchA))->assertOk();
    $this->put(route('branches.update', $branchA), ['name' => 'Branch A Renamed'])->assertRedirect();

    // Cannot access another school branch
    $this->get(route('branches.show', $branchB))->assertForbidden();
    $this->put(route('branches.update', $branchB), ['name' => 'Hacked'])->assertForbidden();
    $this->delete(route('branches.destroy', $branchB))->assertForbidden();
});

test('user cannot create, update, or delete shift in another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchA = Branch::create(['school_id' => $schoolA->id, 'name' => 'Branch A']);
    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);

    $shiftB = Shift::create(['branch_id' => $branchB->id, 'name' => 'Shift B', 'start_time' => '08:00', 'end_time' => '13:00']);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    // Cannot create shift in branch B
    $this->post(route('shifts.store'), [
        'branch_id' => $branchB->id,
        'name' => 'New Shift in B',
        'start_time' => '08:00',
        'end_time' => '13:00',
    ])->assertForbidden();

    // Cannot update or delete shift B
    $this->put(route('shifts.update', $shiftB), [
        'branch_id' => $branchB->id,
        'name' => 'Updated Shift B',
        'start_time' => '08:00',
        'end_time' => '13:00',
    ])->assertForbidden();

    $this->delete(route('shifts.destroy', $shiftB))->assertForbidden();
});

test('user cannot create, update, or delete school class in another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);
    $shiftB = Shift::create(['branch_id' => $branchB->id, 'name' => 'Shift B', 'start_time' => '08:00', 'end_time' => '13:00']);
    $classB = SchoolClass::create(['shift_id' => $shiftB->id, 'name' => 'Class B']);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    // Cannot create class in shift B
    $this->post(route('classes.store'), [
        'shift_id' => $shiftB->id,
        'name' => 'New Class in B',
    ])->assertForbidden();

    // Cannot update or delete class B
    $this->put(route('classes.update', $classB), [
        'shift_id' => $shiftB->id,
        'name' => 'Updated Class B',
    ])->assertForbidden();

    $this->delete(route('classes.destroy', $classB))->assertForbidden();
});

test('user cannot manage students belonging to another school or transfer student to another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchA = Branch::create(['school_id' => $schoolA->id, 'name' => 'Branch A']);
    $shiftA = Shift::create(['branch_id' => $branchA->id, 'name' => 'Shift A', 'start_time' => '08:00', 'end_time' => '13:00']);
    $classA = SchoolClass::create(['shift_id' => $shiftA->id, 'name' => 'Class A']);

    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);
    $shiftB = Shift::create(['branch_id' => $branchB->id, 'name' => 'Shift B', 'start_time' => '08:00', 'end_time' => '13:00']);
    $classB = SchoolClass::create(['shift_id' => $shiftB->id, 'name' => 'Class B']);

    $studentA = Student::create(['class_id' => $classA->id, 'name' => 'Student A']);
    $studentB = Student::create(['class_id' => $classB->id, 'name' => 'Student B']);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    // Cannot create student in class B
    $this->post(route('students.store'), [
        'class_id' => $classB->id,
        'name' => 'Student in B',
    ])->assertForbidden();

    // Cannot update student B
    $this->put(route('students.update', $studentB), [
        'class_id' => $classB->id,
        'name' => 'Renamed Student B',
    ])->assertForbidden();

    // Cannot transfer student A to another school class B
    $this->put(route('students.update', $studentA), [
        'class_id' => $classB->id,
        'name' => 'Student A moved to B',
    ])->assertForbidden();

    // Cannot delete student B
    $this->delete(route('students.destroy', $studentB))->assertForbidden();

    // Cannot view student B hikvision events
    $this->get(route('students.hikvision-events', $studentB))->assertForbidden();
});

test('user cannot update or delete branch device of another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchA = Branch::create(['school_id' => $schoolA->id, 'name' => 'Branch A']);
    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);

    $deviceB = BranchDevice::create([
        'branch_id' => $branchB->id,
        'name' => 'Device B',
        'connection_type' => 'isup',
        'device_id' => 'DEV_B_01',
    ]);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    // Cannot create device on branch B
    $this->post(route('branch_device.store'), [
        'branch_id' => $branchB->id,
        'name' => 'Device in B',
        'connection_type' => 'isup',
        'device_id' => 'DEV_NEW_B',
    ])->assertForbidden();

    // Cannot update or delete device B
    $this->put(route('branch_device.update', $deviceB), [
        'branch_id' => $branchB->id,
        'name' => 'Device B Renamed',
        'connection_type' => 'isup',
        'device_id' => 'DEV_B_01',
    ])->assertForbidden();

    $this->delete(route('branch_device.destroy', $deviceB))->assertForbidden();
});

test('user cannot view or delete attendance or events belonging to another school', function () {
    $schoolA = School::create(['name' => 'School A']);
    $schoolB = School::create(['name' => 'School B']);

    $branchB = Branch::create(['school_id' => $schoolB->id, 'name' => 'Branch B']);
    $shiftB = Shift::create(['branch_id' => $branchB->id, 'name' => 'Shift B', 'start_time' => '08:00', 'end_time' => '13:00']);
    $classB = SchoolClass::create(['shift_id' => $shiftB->id, 'name' => 'Class B']);
    $studentB = Student::create(['class_id' => $classB->id, 'name' => 'Student B', 'employeeNoString' => '999']);

    $attendanceB = DailyAttendance::create([
        'student_id' => $studentB->id,
        'date' => now()->toDateString(),
        'first_check_in' => now(),
    ]);

    $accessB = App\Models\HikvisionAccess::create([
        'dateTime' => now(),
    ]);

    $eventB = HikvisionAccessEvent::create([
        'hikvision_access_id' => $accessB->id,
        'employeeNoString' => '999',
        'student_id' => $studentB->id,
        'channel_id' => 1,
    ]);

    $userA = User::factory()->create();
    UserSchool::create(['user_id' => $userA->id, 'school_id' => $schoolA->id]);

    $this->actingAs($userA);

    $this->get(route('reports.show', $attendanceB->id))->assertForbidden();
    $this->delete(route('reports.destroy', $attendanceB->id))->assertForbidden();
    $this->delete(route('report-events.destroy', $eventB->id))->assertForbidden();
});

test('global admin can access and manage resources across any school', function () {
    $school = School::create(['name' => 'School B']);
    $branch = Branch::create(['school_id' => $school->id, 'name' => 'Branch B']);

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $this->actingAs($admin);

    $this->get(route('branches.show', $branch))->assertOk();
});
