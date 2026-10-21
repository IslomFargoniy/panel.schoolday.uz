<?php

namespace App\Services;

use App\Models\DailyAttendance;
use App\Models\Student;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\Request;

/**
 * Davomat hisoboti: filtrlar, "kelmaganlar" oralig'i va so'rov. Web panel va mobil API shu klassdan foydalanadi.
 */
class AttendanceReport
{
    public function filters(Request $request): array
    {
        return [
            'start_date' => $request->input('start_date') ?: Carbon::today()->toDateString(),
            'end_date' => $request->input('end_date') ?: Carbon::today()->toDateString(),
            'school_id' => $request->input('school_id'),
            'branch_id' => $request->input('branch_id'),
            'shift_id' => $request->input('shift_id'),
            'class_id' => $request->input('class_id'),
            'student_id' => $request->input('student_id'),
            'status' => $request->input('status', 'all'),
            'per_page' => $request->input('per_page', '20'),
        ];
    }

    private const ABSENT_MAX_DAYS = 31;

    /**
     * Normalise the date range of the "absent" report and cap it to ABSENT_MAX_DAYS.
     *
     * @return array{0: Carbon, 1: Carbon, 2: bool} start, end and whether the end was truncated
     */
    public function resolveAbsentRange(string $startDate, string $endDate): array
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        $truncated = false;
        if ($start->diffInDays($end) > self::ABSENT_MAX_DAYS) {
            $end = $start->copy()->addDays(self::ABSENT_MAX_DAYS)->endOfDay();
            $truncated = true;
        }

        return [$start, $end, $truncated];
    }

    public function data(array $filters, bool $paginate = true)
    {
        $schoolIds = Tenant::isGlobalAdmin() ? collect() : Tenant::schoolIds();
        $perPage = $filters['per_page'];
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;
        $startDate = $filters['start_date'];
        $endDate = $filters['end_date'];
        $schoolId = $filters['school_id'];
        $branchId = $filters['branch_id'];
        $shiftId = $filters['shift_id'];
        $classId = $filters['class_id'];
        $studentId = $filters['student_id'];
        $status = $filters['status'];

        if ($status === 'absent') {
            [$start, $end] = $this->resolveAbsentRange($startDate, $endDate);

            // Determine active school days per branch (only dates where at least 1 attendance occurred in that branch)
            $activeDatesQuery = DailyAttendance::query()
                ->join('students', 'daily_attendances.student_id', '=', 'students.id')
                ->join('classes', 'students.class_id', '=', 'classes.id')
                ->join('shifts', 'classes.shift_id', '=', 'shifts.id')
                ->whereBetween('daily_attendances.date', [$start->toDateString(), $end->toDateString()]);

            if (! Tenant::isGlobalAdmin()) {
                $activeDatesQuery->join('branches', 'shifts.branch_id', '=', 'branches.id')
                    ->whereIn('branches.school_id', $schoolIds);
            }

            if ($schoolId) {
                if (Tenant::isGlobalAdmin()) {
                    $activeDatesQuery->join('branches as b_filter', 'shifts.branch_id', '=', 'b_filter.id')
                        ->where('b_filter.school_id', $schoolId);
                } else {
                    $activeDatesQuery->where('branches.school_id', $schoolId);
                }
            }
            if ($branchId) {
                $activeDatesQuery->where('shifts.branch_id', $branchId);
            }

            $activeBranchDates = $activeDatesQuery
                ->select('shifts.branch_id', 'daily_attendances.date')
                ->distinct()
                ->get()
                ->groupBy('branch_id')
                ->map(function ($items) {
                    return $items->pluck('date')->map(fn ($d) => Carbon::parse($d)->toDateString())->unique()->values()->all();
                })
                ->all();

            $studentQuery = Student::where('status', 'active')
                ->with(['schoolClass.shift.branch.school']);

            if (! Tenant::isGlobalAdmin()) {
                $studentQuery->whereHas('schoolClass.shift.branch', function ($b) use ($schoolIds) {
                    $b->whereIn('school_id', $schoolIds);
                });
            }

            if ($studentId) {
                $studentQuery->where('id', $studentId);
            } else {
                if ($classId) {
                    $studentQuery->where('class_id', $classId);
                } elseif ($shiftId) {
                    $studentQuery->whereHas('schoolClass', function ($q) use ($shiftId) {
                        $q->where('shift_id', $shiftId);
                    });
                } elseif ($branchId) {
                    $studentQuery->whereHas('schoolClass.shift', function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                } elseif ($schoolId) {
                    $studentQuery->whereHas('schoolClass.shift.branch', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }
            }

            $students = $studentQuery->get();
            $studentIds = $students->pluck('id')->all();

            $attendancesMap = [];
            if (! empty($studentIds)) {
                $attended = DailyAttendance::whereIn('student_id', $studentIds)
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->select('student_id', 'date')
                    ->get();

                foreach ($attended as $att) {
                    $d = Carbon::parse($att->date)->toDateString();
                    $attendancesMap[$att->student_id . '_' . $d] = true;
                }
            }

            $absentRows = [];
            $curDate = clone $end;
            while ($curDate->greaterThanOrEqualTo($start)) {
                $dateStr = $curDate->toDateString();

                foreach ($students as $student) {
                    $bId = $student->schoolClass?->shift?->branch_id;
                    if (! $bId) {
                        continue;
                    }

                    // Only count as school day if the branch had at least 1 attendance on this date
                    $branchDates = $activeBranchDates[$bId] ?? [];
                    if (! in_array($dateStr, $branchDates, true)) {
                        continue;
                    }

                    // If student attended, skip
                    if (isset($attendancesMap[$student->id . '_' . $dateStr])) {
                        continue;
                    }

                    $item = new DailyAttendance([
                        'date' => Carbon::parse($dateStr),
                    ]);
                    $item->id = 'absent-' . $student->id . '-' . $dateStr;
                    $item->setRelation('student', $student);
                    $item->is_absent_placeholder = true;

                    $absentRows[] = $item;
                }

                $curDate->subDay();
            }

            if ($paginate) {
                $page = (int) request()->input('page', 1);
                $total = count($absentRows);
                $slice = array_slice($absentRows, ($page - 1) * $limit, $limit);

                return new \Illuminate\Pagination\LengthAwarePaginator(
                    $slice,
                    $total,
                    $limit,
                    $page,
                    [
                        'path' => request()->url(),
                        'query' => request()->query(),
                    ]
                );
            }

            return collect($absentRows);
        } else {
            $query = DailyAttendance::with(['student.schoolClass.shift.branch.school'])
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->orderBy('first_check_in', 'desc');

            // Multi-tenant check
            if (! Tenant::isGlobalAdmin()) {
                $query->whereHas('student.schoolClass.shift.branch', function ($b) use ($schoolIds) {
                    $b->whereIn('school_id', $schoolIds);
                });
            }

            if ($status === 'late') {
                $query->where('is_late', true);
            } elseif ($status === 'on_time') {
                $query->where('is_late', false);
            } elseif ($status === 'left_early') {
                $query->where('is_left_early', true)->whereNotNull('last_check_out');
            }

            if ($studentId) {
                $query->where('student_id', $studentId);
            } else {
                if ($classId) {
                    $query->whereHas('student', function ($q) use ($classId) {
                        $q->where('class_id', $classId);
                    });
                } elseif ($shiftId) {
                    $query->whereHas('student.schoolClass', function ($q) use ($shiftId) {
                        $q->where('shift_id', $shiftId);
                    });
                } elseif ($branchId) {
                    $query->whereHas('student.schoolClass.shift', function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                } elseif ($schoolId) {
                    $query->whereHas('student.schoolClass.shift.branch', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }
            }

            return $paginate ? $query->paginate($limit) : $query->get();
        }
    }
}
