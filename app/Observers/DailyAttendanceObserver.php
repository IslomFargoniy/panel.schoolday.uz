<?php

namespace App\Observers;

use App\Events\MonitoringUpdate;
use App\Models\DailyAttendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class DailyAttendanceObserver
{
    /**
     * Handle the DailyAttendance "saved" event.
     */
    public function saved(DailyAttendance $attendance): void
    {
        DB::afterCommit(function () use ($attendance) {
            try {
                MonitoringUpdate::dispatch([
                    'type' => 'attendance_saved',
                    'student_id' => $attendance->student_id,
                    'date' => $attendance->date,
                ]);
            } catch (Throwable $e) {
                Log::warning('MonitoringUpdate broadcast failed on saved: ' . $e->getMessage());
            }
        });
    }

    /**
     * Handle the DailyAttendance "deleted" event.
     */
    public function deleted(DailyAttendance $attendance): void
    {
        DB::afterCommit(function () use ($attendance) {
            try {
                MonitoringUpdate::dispatch([
                    'type' => 'attendance_deleted',
                    'student_id' => $attendance->student_id,
                    'date' => $attendance->date,
                ]);
            } catch (Throwable $e) {
                Log::warning('MonitoringUpdate broadcast failed on deleted: ' . $e->getMessage());
            }
        });
    }
}
