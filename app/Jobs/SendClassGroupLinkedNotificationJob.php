<?php

namespace App\Jobs;

use App\Models\SchoolClass;
use App\Services\Telegram\TelegramService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendClassGroupLinkedNotificationJob implements ShouldQueue
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
    public function __construct(public int $schoolClassId) {}

    /**
     * Execute the job.
     */
    public function handle(TelegramService $telegramService): void
    {
        $schoolClass = SchoolClass::with(['shift.branch.school'])->withCount('students')->find($this->schoolClassId);

        if (! $schoolClass || empty($schoolClass->telegram_group_id)) {
            return;
        }

        if (! $telegramService->hasToken()) {
            return;
        }

        $className = e($schoolClass->name);
        $shiftName = e($schoolClass->shift?->name ?? '-');
        $branchName = e($schoolClass->shift?->branch?->name ?? '-');
        $schoolName = e($schoolClass->shift?->branch?->school?->name ?? '');
        $studentsCount = (int) ($schoolClass->students_count ?? 0);

        $message = "🔔 <b>Telegram guruh sinfga bog'landi!</b>\n\n"
            . "🏫 <b>Sinf:</b> {$className}\n"
            . "🕗 <b>Smena:</b> {$shiftName}\n"
            . "🏢 <b>Filial:</b> {$branchName}\n";

        if (! empty($schoolName)) {
            $message .= "🏛 <b>Maktab:</b> {$schoolName}\n";
        }

        $message .= "👥 <b>O'quvchilar soni:</b> {$studentsCount} ta\n\n"
            . "✅ <i>Ushbu guruh «{$className}» sinfiga muvaffaqiyatli bog'landi. Endi o'quvchilarning davomat xabarnomalari ushbu guruhga yuboriladi.</i>";

        try {
            $telegramService->sendSafeMessage($schoolClass->telegram_group_id, $message);
        } catch (Exception $e) {
            Log::error("Telegram guruhga sinf bog'langanligi haqida xabar yuborishda xatolik ({$schoolClass->telegram_group_id}): " . $e->getMessage());
        }
    }
}
