<?php

use App\Jobs\DeleteStudentFromDevicesJob;
use App\Jobs\SendTelegramNotificationJob;
use App\Jobs\SyncAllStudentsToDeviceJob;
use App\Jobs\SyncStudentToDevicesJob;
use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Models\UserSchool;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Superadmin']);
    Role::firstOrCreate(['name' => 'Admin']);
    Role::firstOrCreate(['name' => 'User']);
});

test('synced access event older than 10 minutes writes attendance but does not dispatch telegram job', function () {
    Queue::fake([SendTelegramNotificationJob::class]);

    $school = School::create([
        'name' => 'Test School',
        'status' => 1,
        'valid_date' => now()->addYear()->toDateString(),
    ]);

    $branch = Branch::create(['name' => 'Filial 1', 'school_id' => $school->id]);
    $shift = Shift::create([
        'name' => '1-Smena',
        'branch_id' => $branch->id,
        'start_time' => '08:00',
        'end_time' => '13:00',
    ]);
    $class = SchoolClass::create(['name' => '5-A', 'shift_id' => $shift->id]);
    $student = Student::create([
        'name' => 'Ali Valiyev',
        'employeeNoString' => '55001',
        'class_id' => $class->id,
        'status' => 'active',
    ]);

    // Create a device
    $device = BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Terminal 1',
        'device_id' => 'DEV_55001',
        'connection_type' => 'isup',
        'status' => true,
    ]);

    $oldTime = now()->subMinutes(30);

    $access = HikvisionAccess::create([
        'shortSerialNumber' => $device->device_id,
        'dateTime' => $oldTime->format('Y-m-d H:i:s'),
        'eventDescription' => 'ISUP AcsEvent Sync',
    ]);

    $event = new HikvisionAccessEvent([
        'employeeNoString' => $student->employeeNoString,
        'attendanceStatus' => null, // null/undefined leaves it to observer
    ]);
    $event->hikvision_access_id = $access->id;
    $event->created_at = $oldTime;
    $event->save();

    // Attendance record was created
    expect(DailyAttendance::where('student_id', $student->id)->exists())->toBeTrue();

    // But Telegram notification was NOT dispatched for old synced event
    Queue::assertNotPushed(SendTelegramNotificationJob::class);
});

test('synced access event less than 10 minutes old dispatches telegram job', function () {
    Queue::fake([SendTelegramNotificationJob::class]);

    $school = School::create([
        'name' => 'Test School 2',
        'status' => 1,
        'valid_date' => now()->addYear()->toDateString(),
    ]);

    $branch = Branch::create(['name' => 'Filial 1', 'school_id' => $school->id]);
    $shift = Shift::create([
        'name' => '1-Smena',
        'branch_id' => $branch->id,
        'start_time' => '08:00',
        'end_time' => '13:00',
    ]);
    $class = SchoolClass::create(['name' => '5-A', 'shift_id' => $shift->id]);
    $student = Student::create([
        'name' => 'Vali Aliyev',
        'employeeNoString' => '55002',
        'class_id' => $class->id,
        'status' => 'active',
    ]);

    $recentTime = now()->subMinutes(2);

    $access = HikvisionAccess::create([
        'shortSerialNumber' => 'DEV_55002',
        'dateTime' => $recentTime->format('Y-m-d H:i:s'),
        'eventDescription' => 'ISUP AcsEvent Sync',
    ]);

    $event = new HikvisionAccessEvent([
        'employeeNoString' => $student->employeeNoString,
        'attendanceStatus' => 'checkIn',
    ]);
    $event->hikvision_access_id = $access->id;
    $event->created_at = $recentTime;
    $event->save();

    Queue::assertPushed(SendTelegramNotificationJob::class);
});

test('student lifecycle events dispatch queue jobs and handle transfers', function () {
    Queue::fake([SyncStudentToDevicesJob::class, DeleteStudentFromDevicesJob::class, SyncAllStudentsToDeviceJob::class]);

    $school = School::create(['name' => 'Test School 3', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $branchA = Branch::create(['name' => 'Filial A', 'school_id' => $school->id]);
    $branchB = Branch::create(['name' => 'Filial B', 'school_id' => $school->id]);

    $deviceA = BranchDevice::create([
        'branch_id' => $branchA->id,
        'name' => 'Terminal A',
        'device_id' => 'DEV_A',
        'connection_type' => 'isup',
        'status' => true,
    ]);

    $shiftA = Shift::create(['name' => 'Shift A', 'branch_id' => $branchA->id, 'start_time' => '08:00', 'end_time' => '13:00']);
    $shiftB = Shift::create(['name' => 'Shift B', 'branch_id' => $branchB->id, 'start_time' => '08:00', 'end_time' => '13:00']);

    $classA = SchoolClass::create(['name' => 'Class A', 'shift_id' => $shiftA->id]);
    $classB = SchoolClass::create(['name' => 'Class B', 'shift_id' => $shiftB->id]);

    // 1. Student created -> SyncStudentToDevicesJob
    $student = Student::create([
        'name' => 'Hasan Aliyev',
        'employeeNoString' => '55003',
        'class_id' => $classA->id,
        'status' => 'active',
    ]);

    Queue::assertPushed(SyncStudentToDevicesJob::class, function ($job) use ($student) {
        return $job->studentId === $student->id;
    });

    // 2. Student transferred to class in Branch B -> DeleteStudentFromDevicesJob dispatched for branch A devices
    $student->update(['class_id' => $classB->id]);

    Queue::assertPushed(DeleteStudentFromDevicesJob::class, function ($job) use ($deviceA) {
        return $job->employeeNo === '55003' && in_array($deviceA->id, $job->deviceIds, true);
    });

    // 3. Student marked inactive -> DeleteStudentFromDevicesJob dispatched
    $student->update(['status' => 'inactive']);

    Queue::assertPushed(DeleteStudentFromDevicesJob::class);

    // 4. Student deleted -> DeleteStudentFromDevicesJob dispatched
    $student->delete();
    Queue::assertPushed(DeleteStudentFromDevicesJob::class);
});

test('branch device creation with isup dispatches SyncAllStudentsToDeviceJob', function () {
    Queue::fake([SyncAllStudentsToDeviceJob::class]);

    $school = School::create(['name' => 'Test School 4', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $branch = Branch::create(['name' => 'Filial 1', 'school_id' => $school->id]);

    $device = BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Terminal ISUP',
        'device_id' => 'DEV_ISUP_NEW',
        'connection_type' => 'isup',
        'status' => true,
    ]);

    Queue::assertPushed(SyncAllStudentsToDeviceJob::class, function ($job) use ($device) {
        return $job->deviceId === $device->id;
    });
});

test('branch device enforces unique device_id', function () {
    $user = User::factory()->create();
    $user->assignRole('Superadmin');

    $school = School::create(['name' => 'Test School 5', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $branch = Branch::create(['name' => 'Filial 1', 'school_id' => $school->id]);

    BranchDevice::create([
        'branch_id' => $branch->id,
        'name' => 'Terminal Unique',
        'device_id' => 'UNIQUE_DEV_1',
        'connection_type' => 'isup',
        'status' => true,
    ]);

    $response = $this->actingAs($user)->post('/branch_device', [
        'branch_id' => $branch->id,
        'name' => 'Terminal Duplicate',
        'device_id' => 'UNIQUE_DEV_1',
        'connection_type' => 'isup',
    ]);

    $response->assertSessionHasErrors(['device_id']);
});

test('user whose schools are inactive or expired is redirected to school.inactive', function () {
    $user = User::factory()->create();
    $user->assignRole('User');

    $school = School::create([
        'name' => 'Expired School',
        'status' => 0, // Inactive
        'valid_date' => now()->subDays(5)->toDateString(), // Expired
    ]);

    UserSchool::create([
        'user_id' => $user->id,
        'school_id' => $school->id,
    ]);

    // Accessing dashboard redirects to school.inactive
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertRedirect(route('school.inactive'));

    // Visiting school.inactive is allowed
    $inactivePage = $this->actingAs($user)->get('/school-inactive');
    $inactivePage->assertOk();

    // Visiting settings profile is allowed
    $settings = $this->actingAs($user)->get('/settings/profile');
    $settings->assertOk();
});

test('global admin can access dashboard even if all schools are expired or inactive', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Superadmin');

    School::create([
        'name' => 'Expired School',
        'status' => 0,
        'valid_date' => now()->subDays(5)->toDateString(),
    ]);

    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertOk();
});

test('absent report excludes dates where branch had zero attendance', function () {
    $admin = User::factory()->create();
    $admin->assignRole('Superadmin');

    $school = School::create(['name' => 'Test School Absent', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $branch = Branch::create(['name' => 'Filial Absent', 'school_id' => $school->id]);
    $shift = Shift::create(['name' => 'Shift 1', 'branch_id' => $branch->id, 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['name' => 'Class 1', 'shift_id' => $shift->id]);

    $studentA = Student::create(['name' => 'Student Present', 'employeeNoString' => '77001', 'class_id' => $class->id, 'status' => 'active']);
    $studentB = Student::create(['name' => 'Student Absent', 'employeeNoString' => '77002', 'class_id' => $class->id, 'status' => 'active']);

    $schoolDay = now()->subDays(1)->toDateString();
    $nonSchoolDay = now()->subDays(2)->toDateString();

    // On $schoolDay, studentA attended
    DailyAttendance::create([
        'student_id' => $studentA->id,
        'date' => $schoolDay,
        'first_check_in' => $schoolDay . ' 07:55:00',
    ]);

    // On $nonSchoolDay, NO ONE attended in the branch.

    // Query absent report for the date range
    $response = $this->actingAs($admin)->get("/reports?status=absent&start_date={$nonSchoolDay}&end_date={$schoolDay}&branch_id={$branch->id}");
    $response->assertOk();

    // Check Inertia attendances collection
    $attendances = $response->viewData('page')['props']['attendances']['data'] ?? [];
    $absentStudentIds = collect($attendances)->pluck('student.id')->all();
    $absentDates = collect($attendances)->pluck('date')->map(fn ($d) => Carbon::parse($d)->toDateString())->all();

    // Student B should appear as absent for $schoolDay
    expect($absentStudentIds)->toContain($studentB->id);
    expect($absentDates)->toContain($schoolDay);

    // But $nonSchoolDay should NOT have any absent records because no attendance happened in the branch
    expect($absentDates)->not->toContain($nonSchoolDay);
});
