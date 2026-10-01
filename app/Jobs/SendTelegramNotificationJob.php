<?php

namespace App\Jobs;

use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use App\Services\Telegram\TelegramService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTelegramNotificationJob implements ShouldQueue
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
        public Student $student,
        public HikvisionAccessEvent $event,
        public string $statusLine,
        public string $datetime
    ) {}

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegramService): void
    {
        $this->student->loadMissing(['schoolClass.shift.branch.school.school_setting']);

        $schoolToken = $this->student->schoolClass?->shift?->branch?->school?->school_setting?->telegram_bot_token;
        if (! empty($schoolToken)) {
            $telegramService = new TelegramService($schoolToken);
        }

        if (! $telegramService->hasToken()) {
            return;
        }

        $groupId = $this->student->schoolClass?->telegram_group_id ?? null;
        if (! $this->student->telegram_id && ! $groupId) {
            return;
        }

        $studentName = e($this->student->name);
        $className = e($this->student->schoolClass?->name ?? '-');
        $shiftName = e($this->student->schoolClass?->shift?->name ?? '-');
        $branchName = e($this->student->schoolClass?->shift?->branch?->name ?? '-');
        $datetime = e($this->datetime);

        $message = "👤 <b>O'quvchi:</b> {$studentName}\n🏫 <b>Sinf:</b> {$className}\n🕗 <b>Smena:</b> {$shiftName}\n🏢 <b>Filial:</b> {$branchName}\n——\n{$this->statusLine}\n📅 <b>Sana:</b> {$datetime}";

        $targets = [];
        if ($this->student->telegram_id) {
            $targets[] = $this->student->telegram_id;
        }
        if ($groupId) {
            $targets[] = $groupId;
        }

        foreach ($targets as $targetId) {
            try {
                if (! empty($this->event->picture)) {
                    $telegramService->sendPhotoWithFallback($targetId, $this->event->picture, $message);
                } else {
                    $telegramService->sendSafeMessage($targetId, $message);
                }
            } catch (Exception $e) {
                Log::error("Telegram yuborishda xato ({$targetId}): " . $e->getMessage());
            }
        }
    }
}
