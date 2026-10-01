<?php

namespace App\Jobs;

use App\Models\Student;
use App\Services\Hikvision\HikvisionSyncService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncStudentToDevicesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $studentId) {}

    public function handle(HikvisionSyncService $syncService): void
    {
        $student = Student::with('schoolClass.shift.branch.devices')->find($this->studentId);
        if (! $student) {
            return;
        }

        try {
            $syncService->syncStudent($student);
        } catch (Exception $e) {
            Log::warning("SyncStudentToDevicesJob failed for student {$this->studentId}: " . $e->getMessage());
        }
    }
}
