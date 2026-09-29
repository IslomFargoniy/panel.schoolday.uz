<?php

use App\Events\MonitoringUpdate;
use App\Models\DailyAttendance;
use App\Models\Student;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Support\Facades\Event;

test('monitoring update event implements should broadcast now and targets monitoring channel', function () {
    $event = new MonitoringUpdate(['source' => 'test']);

    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class);
    expect($event->broadcastAs())->toBe('updated');

    $channels = $event->broadcastOn();
    expect($channels)->toHaveCount(1);
    expect($channels[0]->name)->toBe('monitoring');

    $payload = $event->broadcastWith();
    expect($payload)->toHaveKey('timestamp');
    expect($payload['source'])->toBe('test');
});

test('daily attendance changes dispatch monitoring update event', function () {
    Event::fake([MonitoringUpdate::class]);

    $shift = App\Models\Shift::create([
        'name' => '1-Smena',
        'start_time' => '08:00',
        'end_time' => '13:00',
    ]);

    $class = App\Models\SchoolClass::create([
        'name' => '5-A',
        'shift_id' => $shift->id,
    ]);

    $student = Student::create([
        'name' => 'Ali Valiyev',
        'employeeNoString' => '99001',
        'status' => 'active',
        'class_id' => $class->id,
    ]);

    $attendance = DailyAttendance::create([
        'student_id' => $student->id,
        'date' => now()->toDateString(),
        'first_check_in' => now(),
    ]);

    Event::assertDispatched(MonitoringUpdate::class);

    $attendance->delete();

    Event::assertDispatched(MonitoringUpdate::class);
});
