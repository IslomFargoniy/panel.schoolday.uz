<?php

use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Services\Hikvision\HikvisionSyncService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

function syncFixture(): array
{
    $school = School::create([
        'name' => 'Sync School',
        'status' => 1,
        'valid_date' => now()->addYear()->toDateString(),
    ]);
    $branch = Branch::create(['name' => 'Filial', 'school_id' => $school->id]);
    $shift = Shift::create([
        'name' => '1-Smena',
        'branch_id' => $branch->id,
        'start_time' => '08:00',
        'end_time' => '13:00',
    ]);
    $class = SchoolClass::create(['name' => '5-A', 'shift_id' => $shift->id]);

    $studentA = Student::create(['name' => 'Ali', 'employeeNoString' => 'S-A', 'class_id' => $class->id, 'status' => 'active']);
    $studentB = Student::create(['name' => 'Vali', 'employeeNoString' => 'S-B', 'class_id' => $class->id, 'status' => 'active']);

    $deviceA = BranchDevice::create(['branch_id' => $branch->id, 'name' => 'A', 'device_id' => 'DEV_A', 'connection_type' => 'isup', 'status' => true]);
    $deviceB = BranchDevice::create(['branch_id' => $branch->id, 'name' => 'B', 'device_id' => 'DEV_B', 'connection_type' => 'isup', 'status' => true]);

    return compact('studentA', 'studentB', 'deviceA', 'deviceB');
}

function acsResponse(array $events, ?int $total = null): array
{
    return [
        'response' => json_encode([
            'AcsEvent' => [
                'totalMatches' => $total ?? count($events),
                'numOfMatches' => count($events),
                'InfoList' => $events,
            ],
        ]),
    ];
}

test('serialNo of another ISUP device without MAC is not treated as duplicate', function () {
    Queue::fake();
    ['studentA' => $a, 'studentB' => $b, 'deviceA' => $deviceA, 'deviceB' => $deviceB] = syncFixture();

    // Device A already stored an event with serialNo 1
    $access = HikvisionAccess::create([
        'shortSerialNumber' => $deviceA->device_id,
        'macAddress' => null,
        'dateTime' => now()->subHour()->format('Y-m-d H:i:s'),
        'eventType' => 'AccessControl',
    ]);
    $access->events()->create(['employeeNoString' => $a->employeeNoString, 'serialNo' => 1]);

    // Device B reports its own serialNo 1 for a different student at a different time
    Http::fake([
        '*' => Http::response(acsResponse([
            [
                'employeeNoString' => $b->employeeNoString,
                'serialNo' => 1,
                'time' => now()->subMinutes(30)->format('Y-m-d\TH:i:sP'),
                'attendanceStatus' => 'checkIn',
            ],
        ])),
    ]);

    $result = app(HikvisionSyncService::class)->syncEventsFromDevice($deviceB);

    expect($result['success'])->toBeTrue()
        ->and($result['synced_count'])->toBe(1)
        ->and(HikvisionAccessEvent::where('employeeNoString', $b->employeeNoString)->count())->toBe(1);
});

test('same device serialNo is still deduplicated', function () {
    Queue::fake();
    ['studentA' => $a, 'deviceA' => $deviceA] = syncFixture();

    $time = now()->subMinutes(30);
    $payload = acsResponse([[
        'employeeNoString' => $a->employeeNoString,
        'serialNo' => 7,
        'time' => $time->format('Y-m-d\TH:i:sP'),
        'attendanceStatus' => 'checkIn',
    ]]);

    Http::fake(['*' => Http::response($payload)]);

    $service = app(HikvisionSyncService::class);
    expect($service->syncEventsFromDevice($deviceA)['synced_count'])->toBe(1);
    expect($service->syncEventsFromDevice($deviceA->fresh())['synced_count'])->toBe(0);
});

test('last_event_synced_at is not advanced when gateway fails', function () {
    ['deviceA' => $device] = syncFixture();
    $before = now()->subHours(3)->startOfSecond();
    $device->update(['last_event_synced_at' => $before]);

    Http::fake(['*' => Http::response(['error' => 'boom'], 500)]);

    $result = app(HikvisionSyncService::class)->syncEventsFromDevice($device->fresh());

    expect($result['success'])->toBeFalse()
        ->and($device->fresh()->last_event_synced_at->equalTo($before))->toBeTrue();
});

test('last_event_synced_at is not advanced when AcsEvent is missing in response', function () {
    ['deviceA' => $device] = syncFixture();
    $before = now()->subHours(3)->startOfSecond();
    $device->update(['last_event_synced_at' => $before]);

    Http::fake(['*' => Http::response(['response' => json_encode(['statusString' => 'Device offline'])])]);

    $result = app(HikvisionSyncService::class)->syncEventsFromDevice($device->fresh());

    expect($result['success'])->toBeFalse()
        ->and($device->fresh()->last_event_synced_at->equalTo($before))->toBeTrue();
});

test('last_event_synced_at advances after a fully read multi-page sync', function () {
    Queue::fake();
    ['studentA' => $a, 'studentB' => $b, 'deviceA' => $device] = syncFixture();
    $before = now()->subHours(3)->startOfSecond();
    $device->update(['last_event_synced_at' => $before]);

    $pageOne = acsResponse([[
        'employeeNoString' => $a->employeeNoString,
        'serialNo' => 1,
        'time' => now()->subMinutes(40)->format('Y-m-d\TH:i:sP'),
        'attendanceStatus' => 'checkIn',
    ]], 2);
    $pageTwo = acsResponse([[
        'employeeNoString' => $b->employeeNoString,
        'serialNo' => 2,
        'time' => now()->subMinutes(20)->format('Y-m-d\TH:i:sP'),
        'attendanceStatus' => 'checkIn',
    ]], 2);

    Http::fake(['*' => Http::sequence()->push($pageOne)->push($pageTwo)]);

    $result = app(HikvisionSyncService::class)->syncEventsFromDevice($device->fresh());

    expect($result['success'])->toBeTrue()
        ->and($result['synced_count'])->toBe(2)
        ->and($device->fresh()->last_event_synced_at->greaterThan($before))->toBeTrue();
});

test('last_event_synced_at is not advanced when a later page fails', function () {
    Queue::fake();
    ['studentA' => $a, 'deviceA' => $device] = syncFixture();
    $before = now()->subHours(3)->startOfSecond();
    $device->update(['last_event_synced_at' => $before]);

    $pageOne = acsResponse([[
        'employeeNoString' => $a->employeeNoString,
        'serialNo' => 1,
        'time' => now()->subMinutes(40)->format('Y-m-d\TH:i:sP'),
        'attendanceStatus' => 'checkIn',
    ]], 5);

    Http::fake(['*' => Http::sequence()->push($pageOne)->push(['error' => 'x'], 500)]);

    $result = app(HikvisionSyncService::class)->syncEventsFromDevice($device->fresh());

    expect($result['success'])->toBeFalse()
        ->and($device->fresh()->last_event_synced_at->equalTo($before))->toBeTrue();
});

test('scheduled sync continues from last_event_synced_at when --days is not given', function () {
    $this->freezeTime();
    ['deviceA' => $device] = syncFixture();
    $device->update(['last_event_synced_at' => now()->subMinutes(30)]);

    $sentStart = [];
    Http::fake(function ($request) use (&$sentStart) {
        $sentStart[$request['device_id']] = json_decode($request['body'], true)['AcsEventCond']['startTime'];

        return Http::response(acsResponse([]));
    });

    $this->artisan('hikvision:sync-events')->assertSuccessful();

    expect($sentStart[$device->device_id])->toBe(now()->subMinutes(35)->format('Y-m-d\TH:i:s+05:00'))
        // a device that never synced starts from yesterday
        ->and($sentStart['DEV_B'])->toBe(now()->subDays(1)->format('Y-m-d\T00:00:00+05:00'));
});

test('--days forces a full re-read window', function () {
    $this->freezeTime();
    ['deviceA' => $device] = syncFixture();
    $device->update(['last_event_synced_at' => now()->subMinutes(30)]);

    $sentStart = [];
    Http::fake(function ($request) use (&$sentStart) {
        $sentStart[$request['device_id']] = json_decode($request['body'], true)['AcsEventCond']['startTime'];

        return Http::response(acsResponse([]));
    });

    $this->artisan('hikvision:sync-events', ['--days' => 2])->assertSuccessful();

    expect($sentStart[$device->device_id])->toBe(now()->subDays(2)->format('Y-m-d\T00:00:00+05:00'));
});

test('scheduled event sync does not overlap', function () {
    $event = collect(app(Illuminate\Console\Scheduling\Schedule::class)->events())
        ->first(fn ($e) => str_contains($e->command ?? '', 'hikvision:sync-events'));

    expect($event)->not->toBeNull()
        ->and($event->withoutOverlapping)->toBeTrue();
});
