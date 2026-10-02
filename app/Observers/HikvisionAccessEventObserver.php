<?php

namespace App\Observers;

use App\Jobs\SendTelegramNotificationJob;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            $shift = $student->schoolClass->shift;
            $startHm = Carbon::parse($shift->start_time)->format('H:i');
            $endHm = Carbon::parse($shift->end_time)->format('H:i');

            $isLateAt = fn (CarbonInterface $t) => $t->greaterThan($shiftStartTime);
            $isLeftEarlyAt = fn (CarbonInterface $t) => $t->lessThan($shiftEndTime);
            $lateStatus = fn (bool $late) => $late ? '🔴 <b>Kechikdi</b>' : '🔵 <b>Vaqtida keldi</b>';
            $leftStatus = fn (bool $early) => $early ? '🔴 <b>Vaqtli ketdi</b>' : '🟢 <b>Darsdan so‘ng ketdi</b>';

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
                    $isLeftEarly = $isLeftEarlyAt($now);

                    DailyAttendance::create([
                        'student_id' => $student->id,
                        'date' => $date,
                        'first_check_in' => null,
                        'last_check_out' => $now,
                        'is_late' => false,
                        'is_left_early' => $isLeftEarly,
                        'start_time' => $startHm,
                        'end_time' => $endHm,
                    ]);

                    $statusToNotify = $leftStatus($isLeftEarly);
                } else {
                    // First check-in of the day
                    $isLate = $isLateAt($now);

                    DailyAttendance::create([
                        'student_id' => $student->id,
                        'date' => $date,
                        'first_check_in' => $now,
                        'last_check_out' => null,
                        'is_late' => $isLate,
                        'is_left_early' => false,
                        'start_time' => $startHm,
                        'end_time' => $endHm,
                    ]);

                    $statusToNotify = $lateStatus($isLate);
                }

                return;
            }

            // Hodisalar kechikib / tartibsiz kelishi mumkin (internet uzilishi): yozuv kelish tartibiga emas,
            // hodisa vaqtiga bog'liq bo'lishi kerak — first_check_in doim eng erta, last_check_out doim eng kech vaqt.
            $first = $attendance->first_check_in;
            $last = $attendance->last_check_out;
            $treatAsCheckOut = $isExplicitCheckOut;

            if ($isExplicitCheckIn) {
                if ($first === null) {
                    $isLate = $isLateAt($now);
                    $attendance->update(['first_check_in' => $now, 'is_late' => $isLate]);
                    $statusToNotify = $lateStatus($isLate);
                } elseif ($now->lessThan($first)) {
                    // Ertaroq kirish keyin yetib keldi: eng erta vaqt saqlanadi
                    $wasLate = (bool) $attendance->is_late;
                    $isLate = $isLateAt($now);
                    $attendance->update(['first_check_in' => $now, 'is_late' => $isLate]);
                    if ($wasLate !== $isLate) {
                        $statusToNotify = $lateStatus($isLate);
                    }
                }
                // Aks holda: kirish turniketida qayta skan — chiqish deb hisoblanmaydi

                return;
            }

            if (! $isExplicitCheckOut) {
                // Status ko'rsatilmagan: vaqt farqi bo'yicha aniqlanadi
                if ($first === null) {
                    if ($last !== null && $now->lessThan($last)) {
                        // Faqat chiqish bilan yaratilgan yozuv, keyin undan ertaroq hodisa keldi — bu kirish
                        $isLate = $isLateAt($now);
                        $attendance->update(['first_check_in' => $now, 'is_late' => $isLate]);
                        $statusToNotify = $lateStatus($isLate);

                        return;
                    }
                    $treatAsCheckOut = true;
                } elseif ($now->lessThan($first)) {
                    // Tartibsiz kelgan, birinchi saqlangan hodisadan ertaroq hodisa
                    $updates = ['first_check_in' => $now, 'is_late' => $isLateAt($now)];

                    if (abs($now->diffInMinutes($first)) >= 15 && $last === null) {
                        // Oldin saqlangan "kirish" aslida chiqish edi (u birinchi bo'lib yetib kelgan)
                        $updates['last_check_out'] = $first;
                        $updates['is_left_early'] = $isLeftEarlyAt($first);
                        $updates['start_time'] = $attendance->start_time ?: $startHm;
                        $updates['end_time'] = $attendance->end_time ?: $endHm;
                        $statusToNotify = $leftStatus($updates['is_left_early']);
                    } elseif ((bool) $attendance->is_late !== $updates['is_late']) {
                        // Faqat kechikish holati o'zgarsa xabar beriladi (takroriy kirish skani ikkinchi xabar yubormaydi)
                        $statusToNotify = $lateStatus($updates['is_late']);
                    }

                    $attendance->update($updates);

                    return;
                } elseif (abs($now->diffInMinutes($first)) < 15) {
                    // Kirishdan keyin 15 daqiqa ichidagi skan — kirish turniketida takroriy skan
                    return;
                } else {
                    $treatAsCheckOut = true;
                }
            }

            if ($treatAsCheckOut) {
                // last_check_out hech qachon kamaymaydi (eski chiqish kech yetib kelsa ham)
                $isNewer = $last === null || $now->greaterThan($last);
                $newLast = $isNewer ? $now : $last;
                $alreadyCheckedOutRecently = $last && abs($now->diffInMinutes($last)) < 15;
                $isLeftEarly = $isLeftEarlyAt($newLast);

                $attendance->update([
                    'last_check_out' => $newLast,
                    'is_left_early' => $isLeftEarly,
                    'start_time' => $attendance->start_time ?: $startHm,
                    'end_time' => $attendance->end_time ?: $endHm,
                ]);

                if ($isNewer && ! $alreadyCheckedOutRecently) {
                    $statusToNotify = $leftStatus($isLeftEarly);
                }
            }
        });

        // Telegram xabari (ota-onalarga) faqat yangi hodisa uchun: eskirgan (kechikib yetib kelgan) hodisalar uchun yuborilmaydi,
        // hodisa qaysi yo'l bilan (callback yoki ISUP sync) kelganidan qat'i nazar.
        if ($statusToNotify) {
            $maxDelay = (int) config('hikvision.notify_max_delay_minutes', 10);

            if ($maxDelay > 0 && $now->lessThan(now()->subMinutes($maxDelay))) {
                Log::info('Hikvision: stale event, parent notification skipped', [
                    'student_id' => $student->id,
                    'event_time' => $now->format('Y-m-d H:i:s'),
                    'delay_minutes' => (int) $now->diffInMinutes(now()),
                ]);

                return;
            }

            SendTelegramNotificationJob::dispatch(
                $student,
                $event,
                $statusToNotify,
                $now->format('Y-m-d H:i:s')
            )->afterCommit();
        }
    }
}
