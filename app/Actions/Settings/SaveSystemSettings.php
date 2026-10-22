<?php

namespace App\Actions\Settings;

use App\Exceptions\ActionFailed;
use App\Models\Setting;
use App\Services\Telegram\TelegramService;

class SaveSystemSettings
{
    public const RULES = [
        'telegram_bot_token' => 'nullable|string',
    ];

    /**
     * Saves the values; a new bot token also (re)registers the Telegram webhook.
     * The token is saved even when the webhook step fails — that failure is reported as ActionFailed.
     */
    public function __invoke(array $validated): void
    {
        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if (empty($validated['telegram_bot_token'])) {
            return;
        }

        if (empty(config('services.telegram.webhook_secret'))) {
            // The webhook endpoint rejects every request without a secret, so do not register it
            throw new ActionFailed('settings.telegram_secret_missing');
        }

        $url = url('/api/telegram/webhook');
        if (str_starts_with($url, 'https') && ! app(TelegramService::class)->setWebhook($url)) {
            throw new ActionFailed('settings.telegram_webhook_failed');
        }
    }
}
