<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\EventResource;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    /**
     * Tanlangan kun statistikasi, oxirgi "days" kunlik dinamika va oxirgi kirishlar.
     */
    public function index(Request $request): JsonResponse
    {
        $date = $this->date($request);
        $days = max(1, min(31, $request->integer('days', 7)));

        $students = $this->scoped(Student::where('status', 'active'), 'schoolClass.shift.branch', $request);
        $attendances = $this->scoped(DailyAttendance::query(), 'student.schoolClass.shift.branch', $request);

        $total = (clone $students)->count();
        $day = (clone $attendances)->whereDate('date', $date)
            ->selectRaw('count(*) as present')
            ->selectRaw('sum(case when is_late then 1 else 0 end) as late')
            ->selectRaw('sum(case when is_left_early and last_check_out is not null then 1 else 0 end) as left_early')
            ->first();

        $present = (int) $day->present;
        $late = (int) $day->late;

        $from = $date->copy()->subDays($days - 1);
        $byDate = (clone $attendances)
            ->whereBetween('date', [$from->toDateString(), $date->toDateString()])
            ->selectRaw('date, count(*) as present, sum(case when is_late then 1 else 0 end) as late')
            ->groupBy('date')
            ->get()
            ->keyBy(fn ($row) => substr((string) $row->date, 0, 10));

        $trend = [];
        for ($d = $from->copy(); $d->lte($date); $d->addDay()) {
            $row = $byDate->get($d->toDateString());
            $dayPresent = (int) ($row->present ?? 0);
            $dayLate = (int) ($row->late ?? 0);

            $trend[] = [
                'date' => $d->toDateString(),
                'present' => $dayPresent,
                'late' => $dayLate,
                'on_time' => max(0, $dayPresent - $dayLate),
                // Hech kim kelmagan kun dars kuni emas deb hisoblanadi
                'absent' => $dayPresent > 0 ? max(0, $total - $dayPresent) : 0,
            ];
        }

        $events = $this->scoped(
            HikvisionAccessEvent::with(['student.schoolClass', 'access'])->orderByDesc('id'),
            'student.schoolClass.shift.branch',
            $request
        )->limit(10)->get();

        return $this->ok([
            'date' => $date->toDateString(),
            'stats' => [
                'total_students' => $total,
                'present' => $present,
                'late' => $late,
                'on_time' => max(0, $present - $late),
                'absent' => max(0, $total - $present),
                'left_early' => (int) $day->left_early,
            ],
            'trend' => $trend,
            'recent_events' => EventResource::collection($events)->resolve($request),
        ]);
    }
}
