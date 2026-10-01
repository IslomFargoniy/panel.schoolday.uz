<?php

namespace App\Observers;

use App\Jobs\SendTelegramNotificationJob;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HikvisionAccessEventObserver
{
    /**
     * Handle the HikvisionAccessEvent "created" event.
     */
    public function created(HikvisionAccessEvent $event): void
    {
        // Ignore if no employee string
        if (empty($event->employeeNoString)) {
            return;
        }

        // Identify the student
        $student = Student::with(['schoolClass.shift.branch'])
            ->where('employeeNoString', $event->employeeNoString)
            ->first();

        if (! $student || ! $student->schoolClass || ! $student->schoolClass->shift) {
            return; // Can't process if no student or no shift assigned
        }

        $event->load('access');
        $now = $event->access?->dateTime ? Carbon::parse($event->access->dateTime) : now();
        $date = $now->toDateString();
        $shiftStartTime = Carbon::parse($date . ' ' . $student->schoolClass->shift->start_time);
        $shiftEndTime = Carbon::parse($date . ' ' . $student->schoolClass->shift->end_time);

        $statusToNotify = null;

        DB::transaction(function () use (
            $student,
            $event,
            $now,
            $date,
            $shiftStartTime,
            $shiftEndTime,
            &$statusToNotify
        ) {
            $attendance = DailyAttendance::where('student_id', $student->id)
                ->where('date', $date)
                ->lockForUpdate()
                ->first();

            $explicitStatus = strtolower(trim((string) ($event->attendanceStatus ?? '')));
            $isExplicitCheckIn = in_array($explicitStatus, ['checkin', 'onduty', 'in'], true);
            $isExplicitCheckOut = in_array($explicitStatus, ['checkout', 'offduty', 'out'], true);

            if (! $attendance) {
                if ($isExplicitCheckOut) {
                    // Out-of-order check-out without prior check-in
                    $isLeftEarly = $now->lessThan($shiftEndTime);

                    DailyAttendance::create([
                        'student_id' => $student->id,
                        'date' => $date,
                        'first_check_in' => null,
                        'last_check_out' => $now,
                        'is_late' => false,
                        'is_left_early' => $isLeftEarly,
                        'start_time' => Carbon::parse($student->schoolClass->shift->start_time)->format('H:i'),
                        'end_time' => Carbon::parse($student->schoolClass->shift->end_time)->format('H:i'),
                    ]);

                    $statusToNotify = $isLeftEarly ? '🔴 <b>Vaqtli ketdi</b>' : '🟢 <b>Darsdan so‘ng ketdi</b>';
                } else {
                    // First check-in of the day
                    $isLate = $now->greaterThan($shiftStartTime);

                    DailyAttendance::create([
                        'student_id' => $student->id,
                        'date' => $date,
                        'first_check_in' => $now,
                        'last_check_out' => null,
                        'is_late' => $isLate,
                        'is_left_early' => false,
                        'start_time' => Carbon::parse($student->schoolClass->shift->start_time)->format('H:i'),
                        'end_time' => Carbon::parse($student->schoolClass->shift->end_time)->format('H:i'),
                    ]);

                    $statusToNotify = $isLate ? '🔴 <b>Kechikdi</b>' : '🔵 <b>Vaqtida keldi</b>';
                }
            } else {
                if ($isExplicitCheckIn) {
                    // Re-scan at entrance turnstile: do not treat as check-out
                    if ($attendance->first_check_in === null) {
                        $isLate = $now->greaterThan($shiftStartTime);
                        $attendance->update([
                            'first_check_in' => $now,
                            'is_late' => $isLate,
                        ]);
                        $statusToNotify = $isLate ? '🔴 <b>Kechikdi</b>' : '🔵 <b>Vaqtida keldi</b>';
                    }

                    return;
                }

                if ($isExplicitCheckOut) {
                    // Explicit check-out event
                    $alreadyCheckedOutRecently = $attendance->last_check_out &&
                        abs($now->diffInMinutes($attendance->last_check_out)) < 15;

                    $isLeftEarly = $now->lessThan($shiftEndTime);

                    $attendance->update([
                        'last_check_out' => $now,
                        'is_left_early' => $isLeftEarly,
                        'start_time' => $attendance->start_time ?: Carbon::parse($student->schoolClass->shift->start_time)->format('H:i'),
                        'end_time' => $attendance->end_time ?: Carbon::parse($student->schoolClass->shift->end_time)->format('H:i'),
                    ]);

                    if (! $alreadyCheckedOutRecently) {
                        $statusToNotify = $isLeftEarly ? '🔴 <b>Vaqtli ketdi</b>' : '🟢 <b>Darsdan so‘ng ketdi</b>';
                    }

                    return;
                }

                // Status is unspecified (null/empty): determine by time difference from first_check_in
                $diffMinutes = $attendance->first_check_in ? abs($now->diffInMinutes($attendance->first_check_in)) : 999;

                // If scan occurs within 15 minutes of check-in, consider it a duplicate entrance scan
                if ($diffMinutes < 15) {
                    return;
                }

                // Legitimate check-out after at least 15 minutes of attendance
                $alreadyCheckedOutRecently = $attendance->last_check_out &&
                    abs($now->diffInMinutes($attendance->last_check_out)) < 15;

                $isLeftEarly = $now->lessThan($shiftEndTime);

                $attendance->update([
                    'last_check_out' => $now,
                    'is_left_early' => $isLeftEarly,
                    'start_time' => $attendance->start_time ?: Carbon::parse($student->schoolClass->shift->start_time)->format('H:i'),
                    'end_time' => $attendance->end_time ?: Carbon::parse($student->schoolClass->shift->end_time)->format('H:i'),
                ]);

                if (! $alreadyCheckedOutRecently) {
                    $statusToNotify = $isLeftEarly ? '🔴 <b>Vaqtli ketdi</b>' : '🟢 <b>Darsdan so‘ng ketdi</b>';
                }
            }
        });

        // Send Telegram notification asynchronously via Queue (skip if synced and > 10 min old)
        if ($statusToNotify) {
            $isSynced = ($event->access?->eventDescription === 'ISUP AcsEvent Sync');
            $isOlderThan10Min = $now->lessThan(now()->subMinutes(10));

            if (! ($isSynced && $isOlderThan10Min)) {
                SendTelegramNotificationJob::dispatch(
                    $student,
                    $event,
                    $statusToNotify,
                    $now->format('Y-m-d H:i:s')
                )->afterCommit();
            }
        }
    }
}
