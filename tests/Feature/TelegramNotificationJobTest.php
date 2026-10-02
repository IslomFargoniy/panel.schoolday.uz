<?php

use App\Jobs\SendTelegramMessageJob;
use App\Jobs\SendTelegramNotificationJob;
use App\Models\Branch;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Services\Telegram\TelegramService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    // Hodisalar 2026-09-29 08:15 da: "yangi hodisa" bo'lishi uchun joriy vaqt shu kunga muzlatiladi (eskirgan hodisalar uchun xabar yuborilmaydi)
    Carbon::setTestNow('2026-09-29 08:20:00');
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
        'telegram_group_id' => '-100123456789',
    ]);
    $this->student = Student::create([
        'name' => 'Alisher Navoiy',
        'employeeNoString' => 'STU_1001',
        'class_id' => $this->class->id,
        'telegram_id' => '987654321',
        'status' => 'active',
    ]);
});

afterEach(function () {
    Carbon::setTestNow();
});

test('hikvision access event dispatches SendTelegramNotificationJob', function () {
    Queue::fake();

    $access = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);

    $event = HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => 'STU_1001',
    ]);

    Queue::assertPushed(SendTelegramNotificationJob::class, function ($job) use ($event) {
        return $job->student->id === $this->student->id
            && $job->event->id === $event->id
            && str_contains($job->statusLine, 'Vaqtida keldi');
    });
});

test('rapid rescan within 15 minutes does not dispatch duplicate telegram job', function () {
    Queue::fake();

    $access1 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access1->id,
        'employeeNoString' => 'STU_1001',
    ]);

    Queue::assertPushed(SendTelegramNotificationJob::class, 1);

    // Rescan 20 seconds later
    $access2 = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:20',
    ]);
    HikvisionAccessEvent::create([
        'hikvision_access_id' => $access2->id,
        'employeeNoString' => 'STU_1001',
    ]);

    // Should still be only 1 job pushed
    Queue::assertPushed(SendTelegramNotificationJob::class, 1);
});

test('SendTelegramNotificationJob handle sends message to student and group targets', function () {
    $access = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:15:00',
    ]);
    $event = HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => 'STU_1001',
    ]);

    $telegramServiceMock = Mockery::mock(TelegramService::class);
    $telegramServiceMock->shouldReceive('hasToken')->andReturn(true);

    $sentTargets = [];
    $telegramServiceMock->shouldReceive('sendSafeMessage')
        ->twice()
        ->withArgs(function ($chatId, $message) use (&$sentTargets) {
            $sentTargets[] = (string) $chatId;

            return str_contains($message, 'Alisher Navoiy');
        });

    $job = new SendTelegramNotificationJob(
        $this->student,
        $event,
        '🔵 <b>Vaqtida keldi</b>',
        '2026-09-29 08:15:00'
    );

    $job->handle($telegramServiceMock);

    expect($sentTargets)->toContain('987654321', '-100123456789');
});

test('SendTelegramMessageJob dispatches and executes properly', function () {
    $telegramServiceMock = Mockery::mock(TelegramService::class);
    $telegramServiceMock->shouldReceive('hasToken')->andReturn(true);
    $telegramServiceMock->shouldReceive('sendSafeMessage')
        ->once()
        ->with('123456', 'Salom dunyo');

    $job = new SendTelegramMessageJob(
        chatId: '123456',
        message: 'Salom dunyo'
    );

    $job->handle($telegramServiceMock);
});
