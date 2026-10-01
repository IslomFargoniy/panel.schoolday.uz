<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('getDeviceKey from non-localhost IP without secret returns 403', function () {
    config(['hikvision.gateway_secret' => 'my-secret-key']);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1'])
        ->getJson('/api/hikvision-device-key?deviceId=DEV_01');

    $response->assertForbidden();
});

test('getDeviceKey with valid X-Gateway-Secret header succeeds from remote IP', function () {
    config(['hikvision.gateway_secret' => 'my-secret-key']);

    $branch = Branch::create(['name' => 'Branch Test']);
    BranchDevice::create([
        'branch_id' => $branch->id,
        'device_id' => 'DEV_01',
        'encryption_key' => 'EncPass123',
    ]);

    $response = $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.1'])
        ->withHeader('X-Gateway-Secret', 'my-secret-key')
        ->getJson('/api/hikvision-device-key?deviceId=DEV_01');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'key' => 'EncPass123',
        ]);
});

test('getDeviceKey returns 404 when key is null and no default key configured', function () {
    config(['hikvision.default_encryption_key' => null]);

    $branch = Branch::create(['name' => 'Branch Test']);
    BranchDevice::create([
        'branch_id' => $branch->id,
        'device_id' => 'DEV_NO_KEY',
        'encryption_key' => null,
    ]);

    $response = $this->getJson('/api/hikvision-device-key?deviceId=DEV_NO_KEY');
    $response->assertStatus(404);
});

test('store rejects event from unregistered device', function () {
    $payload = [
        'ipAddress' => '192.168.1.50',
        'macAddress' => 'AA:AA:AA:AA:AA:99',
        'device_id' => 'UNREGISTERED_DEVICE',
        'AccessControllerEvent' => [
            'employeeNoString' => '99999',
        ],
    ];

    $response = $this->postJson('/api/hikvision/events', $payload);
    $response->assertOk()
        ->assertJson([
            'success' => false,
            'reason' => 'device_not_allowed',
        ]);
});

test('store rejects event if student branch does not match device branch', function () {
    $school = School::create(['name' => 'Test School']);
    $branchA = Branch::create(['school_id' => $school->id, 'name' => 'Branch A']);
    $branchB = Branch::create(['school_id' => $school->id, 'name' => 'Branch B']);

    $deviceA = BranchDevice::create([
        'branch_id' => $branchA->id,
        'device_id' => 'DEV_A',
        'status' => true,
    ]);

    $shiftB = Shift::create(['branch_id' => $branchB->id, 'name' => 'Shift B', 'start_time' => '08:00', 'end_time' => '13:00']);
    $classB = SchoolClass::create(['shift_id' => $shiftB->id, 'name' => 'Class B']);
    $studentB = Student::create([
        'class_id' => $classB->id,
        'name' => 'Student from Branch B',
        'employeeNoString' => 'STU_B_100',
        'status' => 'active',
    ]);

    $payload = [
        'device_id' => 'DEV_A',
        'AccessControllerEvent' => [
            'employeeNoString' => 'STU_B_100',
            'deviceName' => 'Turnstile A',
        ],
    ];

    $response = $this->postJson('/api/hikvision/events', $payload);
    $response->assertOk()
        ->assertJson([
            'success' => false,
            'reason' => 'student_branch_mismatch',
        ]);
});

test('store sanitizes shortSerialNumber and prevents path traversal in picture storage', function () {
    Storage::fake('public');

    $school = School::create(['name' => 'Test School']);
    $branch = Branch::create(['school_id' => $school->id, 'name' => 'Branch']);
    $device = BranchDevice::create([
        'branch_id' => $branch->id,
        'device_id' => 'DEV_SECURE',
        'status' => true,
    ]);

    $shift = Shift::create(['branch_id' => $branch->id, 'name' => 'Shift', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'Class']);
    $student = Student::create([
        'class_id' => $class->id,
        'name' => 'Student Test',
        'employeeNoString' => 'STU_PIC_01',
        'status' => 'active',
    ]);

    $file = UploadedFile::fake()->image('face.jpg');

    $eventPayload = [
        'device_id' => 'DEV_SECURE',
        'shortSerialNumber' => '../../etc/passwd',
        'AccessControllerEvent' => [
            'employeeNoString' => 'STU_PIC_01',
            'deviceName' => 'Camera 1',
        ],
    ];

    $response = $this->post('/api/hikvision/events', [
        'AccessControllerEvent' => json_encode($eventPayload),
        'Picture' => $file,
    ]);

    $response->assertOk()
        ->assertJson(['success' => true]);

    // Path must be sanitized to etcpasswd folder under hikvision/, never traversing up
    $files = Storage::disk('public')->allFiles('hikvision');
    expect($files)->not->toBeEmpty();
    expect($files[0])->toMatch('#^hikvision/etcpasswd/[a-f0-9\-]+\.jpe?g$#i');
});
