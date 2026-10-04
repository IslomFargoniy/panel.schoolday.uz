<?php

use App\Jobs\SendClassGroupLinkedNotificationJob;
use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Services\Telegram\TelegramService;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Admin']);

    $this->user = User::factory()->create();
    $this->user->assignRole('Admin');

    $this->school = School::create([
        'name' => '10-Maktab',
        'address' => 'Toshkent',
        'status' => 1,
    ]);

    $this->branch = Branch::create([
        'school_id' => $this->school->id,
        'name' => 'Bosh Filial',
    ]);

    $this->shift = Shift::create([
        'branch_id' => $this->branch->id,
        'name' => '1-smena',
        'start_time' => '08:00',
        'end_time' => '13:00',
    ]);
});

test('creating a school class with telegram_group_id dispatches SendClassGroupLinkedNotificationJob', function () {
    Queue::fake();

    $response = $this->actingAs($this->user)->post('/classes', [
        'name' => '9-"A"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1001234567890',
    ]);

    $response->assertRedirect();

    $schoolClass = SchoolClass::where('name', '9-"A"')->first();
    expect($schoolClass)->not->toBeNull();
    expect($schoolClass->telegram_group_id)->toBe('-1001234567890');

    Queue::assertPushed(SendClassGroupLinkedNotificationJob::class, function ($job) use ($schoolClass) {
        return $job->schoolClassId === $schoolClass->id;
    });
});

test('creating a school class without telegram_group_id does not dispatch notification job', function () {
    Queue::fake();

    $response = $this->actingAs($this->user)->post('/classes', [
        'name' => '9-"B"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '',
    ]);

    $response->assertRedirect();

    Queue::assertNotPushed(SendClassGroupLinkedNotificationJob::class);
});

test('updating a school class to attach a new telegram_group_id dispatches notification job', function () {
    Queue::fake();

    $class = SchoolClass::create([
        'name' => '10-"A"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => null,
    ]);

    $response = $this->actingAs($this->user)->put("/classes/{$class->id}", [
        'name' => '10-"A"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1009988776655',
    ]);

    $response->assertRedirect();

    Queue::assertPushed(SendClassGroupLinkedNotificationJob::class, function ($job) use ($class) {
        return $job->schoolClassId === $class->id;
    });
});

test('updating a school class without changing telegram_group_id does not dispatch notification job', function () {
    $class = SchoolClass::create([
        'name' => '11-"A"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1001122334455',
    ]);

    Queue::fake();

    $response = $this->actingAs($this->user)->put("/classes/{$class->id}", [
        'name' => '11-"A" Yangilangan',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1001122334455',
    ]);

    $response->assertRedirect();

    Queue::assertNotPushed(SendClassGroupLinkedNotificationJob::class);
});

test('updating a school class to clear telegram_group_id does not dispatch notification job', function () {
    $class = SchoolClass::create([
        'name' => '11-"B"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1001122334455',
    ]);

    Queue::fake();

    $response = $this->actingAs($this->user)->put("/classes/{$class->id}", [
        'name' => '11-"B"',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '',
    ]);

    $response->assertRedirect();

    Queue::assertNotPushed(SendClassGroupLinkedNotificationJob::class);
});

test('SendClassGroupLinkedNotificationJob sends formatted HTML message to the telegram group', function () {
    $class = SchoolClass::create([
        'name' => '7-"A" <Maxsus>',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-1005544332211',
    ]);

    Student::create([
        'name' => 'Ali Valiyev',
        'employeeNoString' => 'STU_ALI_VALI',
        'class_id' => $class->id,
        'status' => 'active',
    ]);

    $sentChatId = null;
    $sentMessage = null;

    $mockTelegramService = Mockery::mock(TelegramService::class);
    $mockTelegramService->shouldReceive('hasToken')->andReturn(true);
    $mockTelegramService->shouldReceive('sendSafeMessage')
        ->once()
        ->withArgs(function ($chatId, $message) use (&$sentChatId, &$sentMessage) {
            $sentChatId = $chatId;
            $sentMessage = $message;

            return true;
        })
        ->andReturn(true);

    $job = new SendClassGroupLinkedNotificationJob($class->id);
    $job->handle($mockTelegramService);

    expect($sentChatId)->toBe('-1005544332211');
    expect($sentMessage)->not->toBeNull();
    // HTML tags in user-supplied values must be escaped
    expect($sentMessage)->not->toContain('<Maxsus>');
    expect($sentMessage)->toContain('&lt;Maxsus&gt;');
    expect($sentMessage)->toContain('1-smena');
    expect($sentMessage)->toContain('Bosh Filial');
    expect($sentMessage)->toContain('10-Maktab');
    expect($sentMessage)->toContain('1 ta');
    expect($sentMessage)->toContain("Telegram guruh sinfga bog'landi");
});
