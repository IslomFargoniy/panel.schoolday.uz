<?php

use App\Models\Setting;
use App\Models\User;
use App\Services\Telegram\TelegramService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'Superadmin']);
    Role::firstOrCreate(['name' => 'Admin']);

    $this->superadmin = User::factory()->create();
    $this->superadmin->assignRole('Superadmin');
});

test('saving a bot token without webhook secret does not register the webhook and reports an error', function () {
    config(['services.telegram.webhook_secret' => null]);

    $mock = Mockery::mock(TelegramService::class);
    $mock->shouldNotReceive('setWebhook');
    $this->app->instance(TelegramService::class, $mock);

    $this->actingAs($this->superadmin)
        ->post('https://panel.test/settings/system', ['telegram_bot_token' => '123:ABC'])
        ->assertSessionHas('error', ['key' => 'settings.telegram_secret_missing']);

    expect(Setting::where('key', 'telegram_bot_token')->value('value'))->toBe('123:ABC');
});

test('saving a bot token with a secret registers the webhook', function () {
    config(['services.telegram.webhook_secret' => 'wh-secret']);

    $mock = Mockery::mock(TelegramService::class);
    $mock->shouldReceive('setWebhook')->once()->with('https://panel.test/api/telegram/webhook')->andReturn(true);
    $this->app->instance(TelegramService::class, $mock);

    $this->actingAs($this->superadmin)
        ->post('https://panel.test/settings/system', ['telegram_bot_token' => '123:ABC'])
        ->assertSessionHas('success', ['key' => 'crud.settings_saved'])
        ->assertSessionMissing('error');
});

test('a failed webhook registration is reported to the user', function () {
    config(['services.telegram.webhook_secret' => 'wh-secret']);

    $mock = Mockery::mock(TelegramService::class);
    $mock->shouldReceive('setWebhook')->once()->andReturn(false);
    $this->app->instance(TelegramService::class, $mock);

    $this->actingAs($this->superadmin)
        ->post('https://panel.test/settings/system', ['telegram_bot_token' => '123:ABC'])
        ->assertSessionHas('error', ['key' => 'settings.telegram_webhook_failed']);
});

test('telegram:set-webhook fails without a secret and succeeds with one', function () {
    $mock = Mockery::mock(TelegramService::class);
    $mock->shouldReceive('hasToken')->andReturn(true);
    $mock->shouldReceive('setWebhook')->once()->with('https://panel.test/api/telegram/webhook')->andReturn(true);
    $this->app->instance(TelegramService::class, $mock);

    config(['services.telegram.webhook_secret' => null]);
    $this->artisan('telegram:set-webhook', ['--url' => 'https://panel.test/api/telegram/webhook'])->assertFailed();

    config(['services.telegram.webhook_secret' => 'wh-secret']);
    $this->artisan('telegram:set-webhook', ['--url' => 'https://panel.test/api/telegram/webhook'])->assertSuccessful();
});

test('telegram:set-webhook fails when no global bot token is configured', function () {
    config(['services.telegram.webhook_secret' => 'wh-secret']);

    $mock = Mockery::mock(TelegramService::class);
    $mock->shouldReceive('hasToken')->andReturn(false);
    $mock->shouldNotReceive('setWebhook');
    $this->app->instance(TelegramService::class, $mock);

    $this->artisan('telegram:set-webhook')->assertFailed();
});
