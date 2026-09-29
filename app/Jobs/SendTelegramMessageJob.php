<?php

namespace App\Jobs;

use App\Services\Telegram\TelegramService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTelegramMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [5, 15, 30];

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int|string $chatId,
        public string $message,
        public ?string $picturePath = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegramService): void
    {
        if (! $telegramService->hasToken()) {
            return;
        }

        try {
            if (! empty($this->picturePath)) {
                $telegramService->sendPhotoWithFallback($this->chatId, $this->picturePath, $this->message);
            } else {
                $telegramService->sendSafeMessage($this->chatId, $this->message);
            }
        } catch (Exception $e) {
            Log::error("SendTelegramMessageJob xatolik ({$this->chatId}): " . $e->getMessage());
        }
    }
}
