<?php

namespace App\Observers;

use App\Events\MonitoringUpdate;
use App\Models\DailyAttendance;

class DailyAttendanceObserver
{
    /**
     * Handle the DailyAttendance "saved" event.
     */
    public function saved(DailyAttendance $attendance): void
    {
        MonitoringUpdate::dispatch([
            'type' => 'attendance_saved',
            'student_id' => $attendance->student_id,
            'date' => $attendance->date,
        ]);
    }

    /**
     * Handle the DailyAttendance "deleted" event.
     */
    public function deleted(DailyAttendance $attendance): void
    {
        MonitoringUpdate::dispatch([
            'type' => 'attendance_deleted',
            'student_id' => $attendance->student_id,
            'date' => $attendance->date,
        ]);
    }
}
