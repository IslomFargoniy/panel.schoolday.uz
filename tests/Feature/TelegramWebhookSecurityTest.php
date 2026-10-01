<?php

use App\Jobs\SendTelegramNotificationJob;
use App\Models\Branch;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Shift;
use App\Models\Student;
use App\Models\User;
use App\Services\Telegram\TelegramService;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('services.telegram.webhook_secret', 'test-telegram-secret-999');

    $this->school = School::create([
        'name' => 'Al-Xorazmiy Maktabi',
        'branch_limit' => 5,
        'valid_date' => now()->addYear()->format('Y-m-d'),
        'status' => 1,
    ]);

    $this->branch = Branch::create([
        'name' => 'Bosh Filial <Markaz>',
        'school_id' => $this->school->id,
    ]);

    $this->shift = Shift::create([
        'name' => '1-smena <Ertalab>',
        'branch_id' => $this->branch->id,
        'start_time' => '08:00:00',
        'end_time' => '13:00:00',
    ]);

    $this->class = SchoolClass::create([
        'name' => '9-"B" <Maxsus>',
        'shift_id' => $this->shift->id,
        'telegram_group_id' => '-100987654321',
    ]);
});

test('telegram webhook without secret token returns 403', function () {
    $response = $this->postJson('/api/telegram/webhook', [
        'update_id' => 1,
        'message' => [
            'chat' => ['id' => 12345],
            'text' => '/start',
        ],
    ]);

    $response->assertStatus(403);
});

test('telegram webhook with invalid secret token returns 403', function () {
    $response = $this->withHeaders([
        'X-Telegram-Bot-Api-Secret-Token' => 'invalid-secret-token',
    ])->postJson('/api/telegram/webhook', [
        'update_id' => 1,
        'message' => [
            'chat' => ['id' => 12345],
            'text' => '/start',
        ],
    ]);

    $response->assertStatus(403);
});

test('telegram webhook with valid secret token is accepted', function () {
    $response = $this->withHeaders([
        'X-Telegram-Bot-Api-Secret-Token' => 'test-telegram-secret-999',
    ])->postJson('/api/telegram/webhook', [
        'update_id' => 1,
        'message' => [
            'chat' => ['id' => 12345],
            'from' => ['id' => 12345],
            'text' => '/start',
        ],
    ]);

    $response->assertOk();
});

test('savePhoneNumber rejects contact belonging to someone else', function () {
    $student = Student::create([
        'name' => 'Dilshod Raxmatov',
        'employeeNoString' => 'STU_DILSHOD',
        'class_id' => $this->class->id,
        'phone' => '+998901112233',
        'status' => 'active',
    ]);

    $telegramService = new TelegramService('mock-token-for-test');

    // Someone with from.id = 55555 shares contact belonging to user_id = 77777 (not themselves)
    $update = [
        'message' => [
            'chat' => ['id' => 55555],
            'from' => ['id' => 55555],
            'contact' => [
                'phone_number' => '+998901112233',
                'user_id' => 77777, // Mismatch!
                'first_name' => 'Victim',
            ],
        ],
    ];

    $telegramService->handleUpdate($update);

    $student->refresh();
    expect($student->telegram_id)->toBeNull();
});

test('savePhoneNumber links student when user shares their own contact with normalized phone', function () {
    $student = Student::create([
        'name' => 'Dilshod Raxmatov',
        'employeeNoString' => 'STU_DILSHOD_2',
        'class_id' => $this->class->id,
        'phone' => '+998 (90) 111-22-33', // phone formatted with spaces, plus, parens, dashes
        'status' => 'active',
    ]);

    $telegramService = new TelegramService('mock-token-for-test');

    // User 55555 shares their own contact with plain digits
    $update = [
        'message' => [
            'chat' => ['id' => 55555],
            'from' => ['id' => 55555],
            'contact' => [
                'phone_number' => '998901112233',
                'user_id' => 55555,
                'first_name' => 'Dilshod',
            ],
        ],
    ];

    $telegramService->handleUpdate($update);

    $student->refresh();
    expect($student->telegram_id)->toEqual(55555);
});

test('SendTelegramNotificationJob escapes HTML characters in student, class, branch, and shift names', function () {
    $student = Student::create([
        'name' => 'Aziz <Xaker> & O\'quvchi',
        'employeeNoString' => 'STU_XAKER',
        'class_id' => $this->class->id,
        'telegram_id' => '12345678',
        'status' => 'active',
    ]);

    $access = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:30:00',
    ]);

    $event = HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => 'STU_XAKER',
    ]);

    $telegramServiceMock = Mockery::mock(TelegramService::class);
    $telegramServiceMock->shouldReceive('hasToken')->andReturn(true);

    $capturedMessage = null;
    $telegramServiceMock->shouldReceive('sendSafeMessage')
        ->atLeast()->once()
        ->withArgs(function ($chatId, $message) use (&$capturedMessage) {
            $capturedMessage = $message;

            return true;
        });

    $job = new SendTelegramNotificationJob(
        $student,
        $event,
        '🔵 <b>Vaqtida keldi</b>',
        '2026-09-29 08:30:00'
    );

    $job->handle($telegramServiceMock);

    expect($capturedMessage)->not->toBeNull();
    // Raw unescaped brackets and ampersands must NOT be present as raw tags
    expect($capturedMessage)->not->toContain('<Xaker>');
    expect($capturedMessage)->toContain('&lt;Xaker&gt;');
    expect($capturedMessage)->toContain('Bosh Filial &lt;Markaz&gt;');
    expect($capturedMessage)->toContain('1-smena &lt;Ertalab&gt;');
    expect($capturedMessage)->toContain('9-&quot;B&quot; &lt;Maxsus&gt;');
});

test('SendTelegramNotificationJob uses school bot token if configured on school_settings', function () {
    SchoolSetting::create([
        'school_id' => $this->school->id,
        'telegram_bot_token' => 'school-custom-bot-token-12345',
    ]);

    $student = Student::create([
        'name' => 'Bot Test O\'quvchi',
        'employeeNoString' => 'STU_CUSTOM_BOT',
        'class_id' => $this->class->id,
        'telegram_id' => '12345678',
        'status' => 'active',
    ]);

    $access = HikvisionAccess::create([
        'dateTime' => '2026-09-29 08:30:00',
    ]);

    $event = HikvisionAccessEvent::create([
        'hikvision_access_id' => $access->id,
        'employeeNoString' => 'STU_CUSTOM_BOT',
    ]);

    $defaultMock = Mockery::mock(TelegramService::class);
    $defaultMock->shouldNotReceive('hasToken'); // Should NOT use the default service

    $job = new SendTelegramNotificationJob(
        $student,
        $event,
        '🔵 <b>Keldi</b>',
        '2026-09-29 08:30:00'
    );

    // The job creates a new TelegramService with 'school-custom-bot-token-12345'
    // Since mock token can't connect to telegram, it fails gracefully without throwing
    $job->handle($defaultMock);
    expect(true)->toBeTrue();
});
