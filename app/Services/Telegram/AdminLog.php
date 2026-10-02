<?php

namespace App\Services\Telegram;

use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api;
use Throwable;

/**
 * Administratorlar uchun log kanaliga xabar yuboradi (ota-onalarga emas).
 */
class AdminLog
{
    public static function send(string $message): void
    {
        $token = config('services.telegram_logging.token');
        $chatId = config('services.telegram_logging.chat_id');

        if (! $token || ! $chatId) {
            return;
        }

        try {
            (new Api($token))->sendMessage([
                'chat_id' => $chatId,
                'text' => mb_substr($message, 0, 4000),
                'parse_mode' => 'HTML',
            ]);
        } catch (Throwable $e) {
            Log::error('Telegram Log Error: ' . $e->getMessage());
        }
    }
}
