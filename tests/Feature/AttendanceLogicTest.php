<?php

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;

beforeEach(function () {
    $this->branch = Branch::create(['name' => 'Main Branch']);
    $this->shift = Shift::create([
        'name' => 'Morning Shift',
        'branch_id' => $this->branch->id,
        'start_time' => '08:30:00',
        'end_time' => '13:00:00',
    ]);
    $this->class = SchoolClass::create([
        'name' => '10-A',
        'shift_id' => $this->shift->id,
    ]);
    $this->student = Student::create([
        'name' => 'Alisher Navoiy',
        'employeeNoString' => 'STU_1001',
        'class_id' => $this->class->id,
        'status' => 'active',
    ]);
});

test('first check-in sets first_check_in, is_late false and is_left_early false', function () {
    $access = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);

    $event = HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => 'STU_1001',
    ]);

    $attendance = DailyAttendance::where('student_id', $this->student->id)
        ->where('date', '2026-09-29')
        ->first();

    expect($attendance)->not->toBeNull()
        ->and($attendance->is_late)->toBeFalse()
        ->and($attendance->is_left_early)->toBeFalse()
        ->and($attendance->last_check_out)->toBeNull();
});

test('rapid re-scan within 15 minutes is not treated as check-out', function () {
    // First scan at 08:15
    $access1 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access1->id,
        'employeeNoString' => 'STU_1001',
    ]);

    // Second scan 20 seconds later at 08:15:20
    $access2 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:20',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access2->id,
        'employeeNoString' => 'STU_1001',
    ]);

    $attendance = DailyAttendance::where('student_id', $this->student->id)
        ->where('date', '2026-09-29')
        ->first();

    expect($attendance->last_check_out)->toBeNull()
        ->and($attendance->is_left_early)->toBeFalse();
});

test('legitimate checkout after classes sets last_check_out and is_left_early false', function () {
    // Arrival at 08:15
    $access1 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access1->id,
        'employeeNoString' => 'STU_1001',
    ]);

    // Exit at 13:05 (shift ends at 13:00)
    $access2 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 13:05:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access2->id,
        'employeeNoString' => 'STU_1001',
    ]);

    $attendance = DailyAttendance::where('student_id', $this->student->id)
        ->where('date', '2026-09-29')
        ->first();

    expect($attendance->last_check_out)->not->toBeNull()
        ->and($attendance->is_left_early)->toBeFalse();
});

test('early checkout before shift end sets is_left_early true', function () {
    // Arrival at 08:15
    $access1 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access1->id,
        'employeeNoString' => 'STU_1001',
    ]);

    // Exit at 10:30 (more than 15 min, but before 13:00)
    $access2 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 10:30:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access2->id,
        'employeeNoString' => 'STU_1001',
    ]);

    $attendance = DailyAttendance::where('student_id', $this->student->id)
        ->where('date', '2026-09-29')
        ->first();

    expect($attendance->last_check_out)->not->toBeNull()
        ->and($attendance->is_left_early)->toBeTrue();
});

test('explicit checkIn status never triggers check-out', function () {
    // First scan at 08:15
    $access1 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access1->id,
        'employeeNoString' => 'STU_1001',
        'attendanceStatus' => 'checkIn',
    ]);

    // Second scan 2 hours later with explicit checkIn
    $access2 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 10:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access2->id,
        'employeeNoString' => 'STU_1001',
        'attendanceStatus' => 'checkIn',
    ]);

    $attendance = DailyAttendance::where('student_id', $this->student->id)
        ->where('date', '2026-09-29')
        ->first();

    expect($attendance->last_check_out)->toBeNull();
});

test('hikvision store endpoint processes access event without picture file', function () {
    $payload = [
        'AccessControllerEvent' => [
            'deviceName' => 'Main Gate',
            'employeeNoString' => 'STU_1001',
            'majorEventType' => 5,
            'subEventType' => 75,
            'attendanceStatus' => 'checkIn',
        ],
        'dateTime' => '2026-09-29T08:10:00+05:00',
    ];

    $response = $this->postJson('/api/hikvision/events', [
        'AccessControllerEvent' => json_encode($payload),
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    $this->assertDatabaseHas('hikvision_access_events', [
        'employeeNoString' => 'STU_1001',
    ]);
});

test('dashboard stats filter out inactive students', function () {
    // Create inactive student
    Student::create([
        'name' => 'Inactive Student',
        'employeeNoString' => 'STU_INACTIVE',
        'class_id' => $this->class->id,
        'status' => 'inactive',
    ]);

    Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $user = User::factory()->create();
    $user->assignRole('Admin');
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();

    // Only 1 active student should be counted, not 2
    $page = $response->viewData('page');
    expect($page['props']['stats']['total_students'])->toBe(1);
});
