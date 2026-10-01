<?php

namespace App\Console\Commands;

use App\Services\Telegram\TelegramService;
use Illuminate\Console\Command;

class TelegramSetWebhookCommand extends Command
{
    protected $signature = 'telegram:set-webhook {--url= : Webhook URL (defaults to APP_URL/api/telegram/webhook)}';

    protected $description = 'Register the Telegram webhook for the global bot together with TELEGRAM_WEBHOOK_SECRET';

    public function handle(TelegramService $telegram): int
    {
        if (! $telegram->hasToken()) {
            $this->error('Global Telegram bot token is not configured (Settings > System).');

            return self::FAILURE;
        }

        if (empty(config('services.telegram.webhook_secret'))) {
            $this->error('TELEGRAM_WEBHOOK_SECRET is empty. Set it in .env before registering the webhook.');

            return self::FAILURE;
        }

        $url = $this->option('url') ?: url('/api/telegram/webhook');

        if (! $telegram->setWebhook($url)) {
            $this->error("Failed to register the webhook: {$url}");

            return self::FAILURE;
        }

        $this->info("Webhook registered: {$url}");

        return self::SUCCESS;
    }
}
