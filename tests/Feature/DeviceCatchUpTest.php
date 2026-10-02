<?php

use App\Jobs\CatchUpDeviceEventsJob;
use App\Jobs\SendTelegramNotificationJob;
use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Services\Hikvision\HikvisionSyncService;
use Carbon\Carbon;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Cache::flush();
    config(['hikvision.catchup_gap_minutes' => 30]);
    Carbon::setTestNow(Carbon::parse('2026-10-02 11:29:32', 'Asia/Tashkent'));

    $school = School::create(['name' => 'S', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $this->branch = Branch::create(['school_id' => $school->id, 'name' => 'Filial 1']);
    $shift = Shift::create(['branch_id' => $this->branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);
    $this->student = Student::create(['class_id' => $class->id, 'name' => 'Stu', 'employeeNoString' => 'E-1', 'status' => 'active']);
});

afterEach(function () {
    Carbon::setTestNow();
});

function makeCatchUpDevice(int $branchId, bool $online, ?string $lastSeen): BranchDevice
{
    $d = BranchDevice::create([
        'branch_id' => $branchId,
        'name' => 'ISUP',
        'device_id' => 'branch1',
        'connection_type' => 'isup',
        'status' => true,
        'is_online' => $online,
    ]);
    $d->forceFill(['last_seen_at' => $lastSeen])->save();

    return $d;
}

function fakeGateway(bool $deviceOnline = true, array $events = []): void
{
    Http::fake([
        '*/health' => Http::response(['status' => 'ok', 'connected_devices_count' => 1]),
        '*/api/devices' => Http::response([['device_id' => 'branch1', 'online' => $deviceOnline]]),
        '*/api/isapi' => Http::response(['response' => json_encode(['AcsEvent' => [
            'totalMatches' => count($events), 'numOfMatches' => count($events), 'InfoList' => $events,
        ]])]),
    ]);
}

function isapiStartTimes(): array
{
    return collect(Http::recorded())
        ->filter(fn ($pair) => str_contains($pair[0]->url(), '/api/isapi'))
        ->map(fn ($pair) => json_decode($pair[0]['body'], true)['AcsEventCond']['startTime'])
        ->values()->all();
}

test('device reconnecting after a long gap triggers catch-up sync from the day it was last seen', function () {
    $device = makeCatchUpDevice($this->branch->id, false, '2026-09-30 18:00:00');
    fakeGateway();

    $this->artisan('hikvision:healthcheck')->assertSuccessful();

    expect(isapiStartTimes())->toContain('2026-09-30T00:00:00+05:00');
    expect($device->fresh()->is_online)->toBeTrue();
    expect($device->fresh()->last_seen_at->format('Y-m-d H:i:s'))->toBe('2026-10-02 11:29:32');
});

test('recently seen device does not trigger catch-up on repeated healthchecks', function () {
    makeCatchUpDevice($this->branch->id, true, '2026-10-02 11:28:40');
    fakeGateway();

    $this->artisan('hikvision:healthcheck')->assertSuccessful();
    $this->artisan('hikvision:healthcheck')->assertSuccessful();

    expect(isapiStartTimes())->toBeEmpty();
});

test('catch-up is queued only once for concurrent reconnect signals', function () {
    $device = makeCatchUpDevice($this->branch->id, false, '2026-10-01 18:00:00');
    fakeGateway();

    $this->artisan('hikvision:healthcheck')->assertSuccessful();
    $device->fresh()->markSeen(); // ikkinchi signal (callback/heartbeat)

    expect(isapiStartTimes())->toHaveCount(1);
});

test('catch-up is disabled when gap setting is 0', function () {
    config(['hikvision.catchup_gap_minutes' => 0]);
    makeCatchUpDevice($this->branch->id, false, '2026-09-30 18:00:00');
    fakeGateway();

    $this->artisan('hikvision:healthcheck')->assertSuccessful();

    expect(isapiStartTimes())->toBeEmpty();
});

test('online heartbeat after a long gap triggers catch-up, offline heartbeat does not touch last_seen_at', function () {
    $device = makeCatchUpDevice($this->branch->id, false, '2026-10-01 18:00:00');
    fakeGateway();

    $this->postJson('/api/hikvision-device-status', ['device_id' => 'branch1', 'status' => 'offline'])->assertOk();
    expect($device->fresh()->last_seen_at->format('Y-m-d H:i:s'))->toBe('2026-10-01 18:00:00');
    expect(isapiStartTimes())->toBeEmpty();

    $this->postJson('/api/hikvision-device-status', ['device_id' => 'branch1', 'status' => 'online'])->assertOk();
    expect(isapiStartTimes())->toContain('2026-10-01T00:00:00+05:00');
    expect($device->fresh()->is_online)->toBeTrue();
});

test('callback from a device after a long gap triggers catch-up', function () {
    makeCatchUpDevice($this->branch->id, false, '2026-10-01 18:00:00');
    fakeGateway();
    Queue::fake([SendTelegramNotificationJob::class]);

    $this->postJson('/api/hikvision/events', [
        'device_id' => 'branch1',
        'dateTime' => '2026-10-02T11:29:00+05:00',
        'AccessControllerEvent' => ['employeeNoString' => 'E-1', 'attendanceStatus' => 'checkIn'],
    ])->assertOk();

    expect(isapiStartTimes())->toContain('2026-10-01T00:00:00+05:00');
});

test('catch-up syncs events but never notifies parents about stale events', function () {
    makeCatchUpDevice($this->branch->id, false, '2026-10-01 18:00:00');
    fakeGateway(true, [['employeeNoString' => 'E-1', 'time' => '2026-10-01T08:10:00+05:00', 'serialNo' => 77]]);
    Queue::fake([SendTelegramNotificationJob::class]); // faqat ota-onalarga xabar job'i qalbaki, catch-up haqiqiy ishlaydi

    $this->artisan('hikvision:healthcheck')->assertSuccessful();

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
    Queue::assertNotPushed(SendTelegramNotificationJob::class);
    expect(\App\Models\DailyAttendance::where('student_id', $this->student->id)->where('date', '2026-10-01')->exists())->toBeTrue();
});

test('catch-up job splits a long gap into day windows and keeps timeout below queue retry_after', function () {
    $device = makeCatchUpDevice($this->branch->id, true, '2026-10-02 11:29:00');
    fakeGateway();

    (new CatchUpDeviceEventsJob($device->id, '2026-09-26 18:00:00'))->handle(app(HikvisionSyncService::class));

    expect(isapiStartTimes())->toBe([
        '2026-09-26T00:00:00+05:00',
        '2026-09-28T00:00:00+05:00',
        '2026-09-30T00:00:00+05:00',
        '2026-10-02T00:00:00+05:00',
    ]);

    expect((new CatchUpDeviceEventsJob(1, 'x'))->timeout)->toBeLessThan((int) config('queue.connections.database.retry_after', 90));
});

test('long offline device raises a one-time alert that is cleared on reconnect', function () {
    $device = makeCatchUpDevice($this->branch->id, true, '2026-10-02 08:00:00');
    Http::fake([
        '*/health' => Http::response(['status' => 'ok', 'connected_devices_count' => 0]),
        '*/api/devices' => Http::sequence()
            ->push([['device_id' => 'branch1', 'online' => false]])
            ->push([['device_id' => 'branch1', 'online' => true]]),
        '*/api/isapi' => Http::response(['response' => json_encode(['AcsEvent' => ['totalMatches' => 0, 'numOfMatches' => 0, 'InfoList' => []]])]),
    ]);

    $this->artisan('hikvision:healthcheck')->assertSuccessful();
    expect($device->fresh()->is_online)->toBeFalse();
    expect(Cache::has("hikvision_device_down_alert:{$device->id}"))->toBeTrue();

    $this->artisan('hikvision:healthcheck')->assertSuccessful();
    expect(Cache::has("hikvision_device_down_alert:{$device->id}"))->toBeFalse();
});

test('hikvision:sync-events accepts --from and --to', function () {
    makeCatchUpDevice($this->branch->id, true, '2026-10-02 11:29:00');
    fakeGateway();

    $this->artisan('hikvision:sync-events', ['--from' => '2026-09-28', '--to' => '2026-09-30'])->assertSuccessful();

    Http::assertSent(function (Request $request) {
        if (! str_contains($request->url(), '/api/isapi')) {
            return false;
        }
        $cond = json_decode($request['body'], true)['AcsEventCond'];

        return $cond['startTime'] === '2026-09-28T00:00:00+05:00' && $cond['endTime'] === '2026-09-30T23:59:59+05:00';
    });
});

// ---- 6. Ulanmagan qurilma uchun log shovqini yo'q ----

test('hikvision:sync-events skips offline devices unless a device is given explicitly', function () {
    makeCatchUpDevice($this->branch->id, false, null);
    fakeGateway();

    $this->artisan('hikvision:sync-events')->assertSuccessful();
    expect(isapiStartTimes())->toBeEmpty();

    $this->artisan('hikvision:sync-events', ['--device_id' => 'branch1'])->assertSuccessful();
    expect(isapiStartTimes())->not->toBeEmpty();
});
