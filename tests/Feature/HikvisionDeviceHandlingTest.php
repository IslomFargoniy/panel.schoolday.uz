<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

function hikvisionSetup(string $deviceId = 'DEV_X', array $deviceAttrs = []): array
{
    $school = School::create(['name' => 'S', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $branch = Branch::create(['school_id' => $school->id, 'name' => 'B']);
    $device = BranchDevice::create(array_merge([
        'branch_id' => $branch->id,
        'device_id' => $deviceId,
        'connection_type' => 'isup',
        'status' => true,
    ], $deviceAttrs));
    $shift = Shift::create(['branch_id' => $branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);
    $student = Student::create(['class_id' => $class->id, 'name' => 'Stu', 'employeeNoString' => 'E-1', 'status' => 'active']);

    return compact('device', 'student');
}

test('heartbeat does not re-enable a disabled device', function () {
    ['device' => $device] = hikvisionSetup('DEV_OFF', ['status' => false]);

    $this->postJson('/api/hikvision-device-status', ['device_id' => 'DEV_OFF', 'status' => 'online'])
        ->assertOk();

    $fresh = $device->fresh();
    expect($fresh->status)->toBeFalse()
        ->and($fresh->is_online)->toBeTrue()
        ->and($fresh->last_seen_at)->not->toBeNull();
});

test('store accepts the deviceID spelling in the payload', function () {
    Queue::fake();
    hikvisionSetup('DEV_UPPER');

    $this->postJson('/api/hikvision/events', [
        'deviceID' => 'DEV_UPPER',
        'AccessControllerEvent' => ['employeeNoString' => 'E-1'],
    ])->assertOk()->assertJson(['success' => true]);

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
});

test('store accepts the device id from the query string', function () {
    Queue::fake();
    hikvisionSetup('DEV_QS');

    $this->postJson('/api/hikvision/events?deviceId=DEV_QS', [
        'AccessControllerEvent' => ['employeeNoString' => 'E-1'],
    ])->assertOk()->assertJson(['success' => true]);
});

test('rejected events log the payload keys but not their values', function () {
    Log::spy();

    $this->postJson('/api/hikvision/events', [
        'device_id' => 'UNKNOWN',
        'secretLookingValue' => 'do-not-log-me',
        'AccessControllerEvent' => ['employeeNoString' => 'E-1'],
    ])->assertOk()->assertJson(['reason' => 'device_not_allowed']);

    Log::shouldHaveReceived('info')->withArgs(function ($message, $context = []) {
        return str_contains($message, 'rejected event')
            && in_array('secretLookingValue', $context['payload_keys'] ?? [], true)
            && ! str_contains(json_encode($context), 'do-not-log-me');
    })->once();
});

test('localhost is no longer trusted when trust_localhost is disabled', function () {
    config(['hikvision.gateway_secret' => 'top-secret', 'hikvision.trust_localhost' => false]);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/hikvision-device-key?deviceId=ANY')
        ->assertForbidden();

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->withHeader('X-Gateway-Secret', 'top-secret')
        ->getJson('/api/hikvision-device-key?deviceId=ANY')
        ->assertStatus(404);
});

test('localhost is trusted by default', function () {
    config(['hikvision.default_encryption_key' => null]);

    $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
        ->getJson('/api/hikvision-device-key?deviceId=ANY')
        ->assertStatus(404);
});
