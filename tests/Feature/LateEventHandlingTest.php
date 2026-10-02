<?php

use App\Jobs\SendTelegramNotificationJob;
use App\Models\Branch;
use App\Models\BranchDevice;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Cache::flush();
    $school = School::create(['name' => 'S', 'status' => 1, 'valid_date' => now()->addYear()->toDateString()]);
    $this->branch = Branch::create(['school_id' => $school->id, 'name' => 'B']);
    $this->device = BranchDevice::create([
        'branch_id' => $this->branch->id,
        'device_id' => 'DEV_LATE',
        'connection_type' => 'isup',
        'status' => true,
    ]);
    $shift = Shift::create(['branch_id' => $this->branch->id, 'name' => 'Sh', 'start_time' => '08:00', 'end_time' => '13:00']);
    $class = SchoolClass::create(['shift_id' => $shift->id, 'name' => 'C']);
    $this->student = Student::create(['class_id' => $class->id, 'name' => 'Stu', 'employeeNoString' => 'E-1', 'status' => 'active']);
});

function postHikvisionEvent($test, string $dateTime, ?string $status = null, string $emp = 'E-1')
{
    $event = ['employeeNoString' => $emp];
    if ($status !== null) {
        $event['attendanceStatus'] = $status;
    }

    return $test->postJson('/api/hikvision/events', [
        'device_id' => 'DEV_LATE',
        'dateTime' => $dateTime,
        'AccessControllerEvent' => $event,
    ]);
}

function attendanceFor($student, string $date): ?DailyAttendance
{
    return DailyAttendance::where('student_id', $student->id)->where('date', $date)->first();
}

// ---- 1. Debounce: turli vaqtdagi hodisalar yo'qolmaydi ----

test('callback keeps both check-in and check-out of the same student when they arrive within seconds (offline backlog)', function () {
    Queue::fake();

    postHikvisionEvent($this, '2026-09-29T08:05:00+05:00', 'checkIn')->assertOk()->assertJson(['success' => true])->assertJsonMissing(['reason' => 'duplicate_ignored']);
    postHikvisionEvent($this, '2026-09-29T13:10:00+05:00', 'checkOut')->assertOk()->assertJsonMissing(['reason' => 'duplicate_ignored']);

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(2);

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('08:05')
        ->and($att->last_check_out->format('H:i'))->toBe('13:10');
});

test('identical event retried within the debounce window is stored once', function () {
    Queue::fake();

    postHikvisionEvent($this, '2026-09-29T08:05:00+05:00', 'checkIn')->assertOk();
    postHikvisionEvent($this, '2026-09-29T08:05:00+05:00', 'checkIn')->assertOk()->assertJson(['reason' => 'duplicate_ignored']);

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
});

test('payload without dateTime keeps the legacy per-student debounce', function () {
    Queue::fake();

    $this->postJson('/api/hikvision/events', ['device_id' => 'DEV_LATE', 'AccessControllerEvent' => ['employeeNoString' => 'E-1']])->assertOk();
    $this->postJson('/api/hikvision/events', ['device_id' => 'DEV_LATE', 'AccessControllerEvent' => ['employeeNoString' => 'E-1']])
        ->assertOk()->assertJson(['reason' => 'duplicate_ignored']);

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
});

// ---- 2. Persistent duplicate check ----

test('callback does not duplicate an event already stored (e.g. by ISUP sync) and does not re-notify', function () {
    Queue::fake();

    $access = HikvisionAccess::create(['dateTime' => '2026-09-29 08:05:00', 'eventDescription' => 'ISUP AcsEvent Sync']);
    HikvisionAccessEvent::create(['hikvision_access_id' => $access->id, 'employeeNoString' => 'E-1', 'attendanceStatus' => 'checkIn']);
    $before = attendanceFor($this->student, '2026-09-29')->toArray();

    Queue::fake(); // yozuvni yaratish paytidagi dispatchlarni tozalaymiz
    Cache::flush(); // debounce emas, aynan doimiy tekshiruv ishlashini tekshiramiz

    postHikvisionEvent($this, '2026-09-29T08:05:00+05:00', 'checkIn')->assertOk()->assertJson(['success' => true, 'reason' => 'duplicate_existing']);

    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
    expect(HikvisionAccess::count())->toBe(1);
    expect(attendanceFor($this->student, '2026-09-29')->toArray())->toBe($before);
    Queue::assertNotPushed(SendTelegramNotificationJob::class);
});

test('callback attaches its picture to an existing event that has none', function () {
    Queue::fake();
    Storage::fake('public');

    $access = HikvisionAccess::create(['dateTime' => '2026-09-29 08:05:00', 'eventDescription' => 'ISUP AcsEvent Sync']);
    $existing = HikvisionAccessEvent::create(['hikvision_access_id' => $access->id, 'employeeNoString' => 'E-1', 'attendanceStatus' => 'checkIn']);
    Cache::flush();

    $this->post('/api/hikvision/events', [
        'AccessControllerEvent' => json_encode([
            'device_id' => 'DEV_LATE',
            'dateTime' => '2026-09-29T08:05:00+05:00',
            'AccessControllerEvent' => ['employeeNoString' => 'E-1', 'attendanceStatus' => 'checkIn'],
        ]),
        'Picture' => UploadedFile::fake()->image('face.jpg'),
    ], ['Accept' => 'application/json'])->assertOk()->assertJson(['reason' => 'duplicate_existing']);

    expect($existing->fresh()->picture)->not->toBeEmpty();
    Storage::disk('public')->assertExists($existing->fresh()->picture);
    expect(HikvisionAccessEvent::where('employeeNoString', 'E-1')->count())->toBe(1);
});

// ---- 3. Observer hodisalar kelish tartibidan mustaqil ----

function scanEvent($student, string $dateTime, ?string $status = null): HikvisionAccessEvent
{
    $access = HikvisionAccess::create(['dateTime' => $dateTime]);

    return HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => $student->employeeNoString,
        'attendanceStatus' => $status,
    ]);
}

test('late-delivered check-in after check-out keeps earliest first_check_in and latest last_check_out', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 13:10:00', 'checkOut');
    scanEvent($this->student, '2026-09-29 07:55:00', 'checkIn');

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('07:55')
        ->and($att->last_check_out->format('H:i'))->toBe('13:10')
        ->and($att->is_late)->toBeFalse()
        ->and($att->is_left_early)->toBeFalse();
});

test('older check-out arriving late never moves last_check_out backwards', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 08:05:00', 'checkIn');
    scanEvent($this->student, '2026-09-29 13:10:00', 'checkOut');
    scanEvent($this->student, '2026-09-29 11:00:00', 'checkOut');

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->last_check_out->format('H:i'))->toBe('13:10')
        ->and($att->is_left_early)->toBeFalse();
});

test('earlier explicit check-in arriving late recalculates is_late', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 08:30:00', 'checkIn');
    expect(attendanceFor($this->student, '2026-09-29')->is_late)->toBeTrue();

    scanEvent($this->student, '2026-09-29 07:55:00', 'checkIn');

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('07:55')
        ->and($att->is_late)->toBeFalse();
});

test('status-less events arriving out of order: the early one becomes the arrival and the first stored one the exit', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 13:05:00'); // birinchi yetib kelgan (aslida chiqish)
    scanEvent($this->student, '2026-09-29 07:50:00'); // ertaroq, kech yetib keldi

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('07:50')
        ->and($att->last_check_out->format('H:i'))->toBe('13:05')
        ->and($att->is_late)->toBeFalse()
        ->and($att->is_left_early)->toBeFalse();
});

test('status-less earlier scan within 15 minutes only moves first_check_in', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 08:10:00');
    scanEvent($this->student, '2026-09-29 08:05:00');

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('08:05')
        ->and($att->last_check_out)->toBeNull();
});

test('check-out only record gets its arrival from an earlier status-less event', function () {
    Queue::fake();

    scanEvent($this->student, '2026-09-29 13:10:00', 'checkOut');
    scanEvent($this->student, '2026-09-29 08:20:00'); // statussiz, chiqishdan ertaroq

    $att = attendanceFor($this->student, '2026-09-29');
    expect($att->first_check_in->format('H:i'))->toBe('08:20')
        ->and($att->last_check_out->format('H:i'))->toBe('13:10')
        ->and($att->is_late)->toBeTrue();
});

// ---- 4. Eskirgan hodisalar uchun ota-onalarga xabar yuborilmaydi ----

test('stale event arriving via callback updates attendance but does not notify parents', function () {
    Queue::fake();
    \Carbon\Carbon::setTestNow('2026-09-30 09:00:00');

    postHikvisionEvent($this, '2026-09-29T08:10:00+05:00', 'checkIn')->assertOk()->assertJson(['success' => true]);

    expect(attendanceFor($this->student, '2026-09-29'))->not->toBeNull();
    Queue::assertNotPushed(SendTelegramNotificationJob::class);

    \Carbon\Carbon::setTestNow();
});

test('fresh event via callback still notifies parents', function () {
    Queue::fake();
    \Carbon\Carbon::setTestNow('2026-09-29 08:12:00');

    postHikvisionEvent($this, '2026-09-29T08:10:00+05:00', 'checkIn')->assertOk();

    Queue::assertPushed(SendTelegramNotificationJob::class, 1);
    \Carbon\Carbon::setTestNow();
});

test('notify_max_delay_minutes = 0 disables the stale-event filter', function () {
    Queue::fake();
    config(['hikvision.notify_max_delay_minutes' => 0]);
    \Carbon\Carbon::setTestNow('2026-09-30 09:00:00');

    postHikvisionEvent($this, '2026-09-29T08:10:00+05:00', 'checkIn')->assertOk();

    Queue::assertPushed(SendTelegramNotificationJob::class, 1);
    \Carbon\Carbon::setTestNow();
});

test('unchanged record (re-scan, older check-out) does not send a notification', function () {
    Queue::fake();

    \Carbon\Carbon::setTestNow('2026-09-29 08:06:00');
    scanEvent($this->student, '2026-09-29 08:05:00', 'checkIn');
    \Carbon\Carbon::setTestNow('2026-09-29 13:11:00');
    scanEvent($this->student, '2026-09-29 13:10:00', 'checkOut');
    Queue::assertPushed(SendTelegramNotificationJob::class, 2);

    Queue::fake();
    \Carbon\Carbon::setTestNow('2026-09-29 13:12:00');
    scanEvent($this->student, '2026-09-29 13:11:30', 'checkOut'); // 15 daqiqa ichida takroriy chiqish
    scanEvent($this->student, '2026-09-29 11:00:00', 'checkOut'); // eski chiqish: yozuv o'zgarmaydi
    scanEvent($this->student, '2026-09-29 09:00:00', 'checkIn');  // qayta skan: o'zgarmaydi
    Queue::assertNotPushed(SendTelegramNotificationJob::class);

    \Carbon\Carbon::setTestNow();
});
