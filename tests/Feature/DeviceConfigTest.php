<?php

use App\Jobs\SyncAllStudentsToDeviceJob;
use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Services\Hikvision\DeviceConfigService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

/** The gateway's ISAPI passthrough answer: {"success":true,"response":"<device answer>"}. */
function gatewayAnswer(string $deviceAnswer): array
{
    return ['success' => true, 'response' => $deviceAnswer];
}

/** Device users answer of /ISAPI/AccessControl/UserInfo/Search. */
function deviceUsersAnswer(array $employeeNos): array
{
    return gatewayAnswer(json_encode(['UserInfoSearch' => [
        'responseStatusStrg' => 'OK', 'numOfMatches' => count($employeeNos), 'totalMatches' => count($employeeNos),
        'UserInfo' => array_map(fn ($no) => ['employeeNo' => $no, 'numOfFace' => 1], $employeeNos),
    ]]));
}

beforeEach(function () {
    Queue::fake();
    $school = School::create(['name' => 'S', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $this->branch = Branch::create(['school_id' => $school->id, 'name' => 'B']);
    $shift = Shift::create(['branch_id' => $this->branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
    $this->class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);
    // A newly added device: generated ID, no MAC, not prepared yet
    $this->device = BranchDevice::create(['branch_id' => $this->branch->id, 'connection_type' => 'isup', 'is_online' => true]);
});

test('a device added without a MAC address gets it from the terminal, a typed one is kept', function () {
    $this->device->forceFill(['users_cleaned_at' => now()])->save();
    Http::fake(['*/api/isapi' => fn (Request $r) => $r['url'] === 'GET /ISAPI/System/deviceInfo'
        ? Http::response(gatewayAnswer('<DeviceInfo><deviceName>Kirish</deviceName><macAddress>88-de-39-32-d8-0f</macAddress></DeviceInfo>'))
        : Http::response(gatewayAnswer('{"statusCode":1}'))]);
    $service = app(DeviceConfigService::class);

    expect($service->ensure($this->device)['mac_filled'])->toBeTrue()
        ->and($this->device->fresh()->mac_address)->toBe('88:DE:39:32:D8:0F');

    $this->device->forceFill(['mac_address' => 'E0:CA:3C:F9:F5:89'])->save();
    expect($service->ensure($this->device->fresh())['mac_filled'])->toBeFalse()
        ->and($this->device->fresh()->mac_address)->toBe('E0:CA:3C:F9:F5:89');
});

test('a newly added device drops the users left from elsewhere once and gets the branch students, a device in use is never cleaned', function () {
    $student = Student::create(['class_id' => $this->class->id, 'name' => 'Ali', 'employeeNoString' => 'E-1', 'status' => 'active']);
    $this->device->forceFill(['mac_address' => 'AA:BB:CC:DD:EE:01'])->save();
    $deleted = [];
    Http::fake(['*/api/isapi' => function (Request $r) use (&$deleted) {
        if ($r['url'] === 'POST /ISAPI/AccessControl/UserInfo/Search?format=json') {
            return Http::response(deviceUsersAnswer(['E-1', '9001', '9002']));
        }
        if ($r['url'] === 'PUT /ISAPI/AccessControl/UserInfo/Delete?format=json') {
            $deleted = array_merge($deleted, array_column(json_decode($r['body'], true)['UserInfoDelCond']['EmployeeNoList'], 'employeeNo'));
        }

        return Http::response(gatewayAnswer('{"statusCode":1}'));
    }]);
    $service = app(DeviceConfigService::class);

    $result = $service->ensure($this->device);

    expect($result['users_removed'])->toBe(2)
        ->and($result['students_queued'])->toBeTrue()
        ->and($deleted)->toBe(['9001', '9002'])
        ->and($this->device->fresh()->users_cleaned_at)->not->toBeNull();
    Queue::assertPushed(SyncAllStudentsToDeviceJob::class, fn ($job) => $job->deviceId === $this->device->id);

    $deleted = [];
    expect($service->ensure($this->device->fresh())['users_removed'])->toBe(0)->and($deleted)->toBe([]);
    expect($student->fresh()->status)->toBe('active');
});

test('a device of a branch without active students is not emptied', function () {
    $this->device->forceFill(['mac_address' => 'AA:BB:CC:DD:EE:01'])->save();
    Http::fake(['*/api/isapi' => Http::response(deviceUsersAnswer(['9001']))]);

    expect(app(DeviceConfigService::class)->ensure($this->device)['users_removed'])->toBe(0)
        ->and($this->device->fresh()->users_cleaned_at)->toBeNull();
    Http::assertNothingSent();
});

test('a failed user read never counts as an empty device', function () {
    Student::create(['class_id' => $this->class->id, 'name' => 'Ali', 'employeeNoString' => 'E-1', 'status' => 'active']);
    $this->device->forceFill(['mac_address' => 'AA:BB:CC:DD:EE:01'])->save();
    Http::fake(['*/api/isapi' => Http::response(['success' => false], 504)]);

    $result = app(DeviceConfigService::class)->ensure($this->device);

    expect($result['errors'])->not->toBeEmpty()
        ->and($this->device->fresh()->users_cleaned_at)->toBeNull();
    Http::assertNotSent(fn (Request $r) => str_contains((string) $r['url'], 'UserInfo/Delete'));
});

test('the periodic check only asks online devices that still need something', function () {
    $this->device->forceFill(['mac_address' => null, 'users_cleaned_at' => now()])->save();
    BranchDevice::create(['branch_id' => $this->branch->id, 'device_id' => 'branch1', 'connection_type' => 'isup', 'is_online' => true, 'mac_address' => 'AA:BB:CC:DD:EE:02'])
        ->forceFill(['users_cleaned_at' => now()])->save();
    Http::fake(['*/api/isapi' => Http::response(gatewayAnswer('<DeviceInfo><macAddress>88:de:39:32:d8:0f</macAddress></DeviceInfo>'))]);

    $this->artisan('hikvision:ensure-device-config')->assertSuccessful();

    Http::assertSentCount(1);
    Http::assertSent(fn (Request $r) => $r['device_id'] === $this->device->device_id && $r['url'] === 'GET /ISAPI/System/deviceInfo');
    expect($this->device->fresh()->mac_address)->toBe('88:DE:39:32:D8:0F');
});
