<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\HikvisionAccessEvent;
use App\Models\School;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today()->toDateString();
        $schoolId = $request->input('school_id');
        $branchId = $request->input('branch_id');

        $studentQuery = Student::where('status', 'active');
        $attendanceQuery = DailyAttendance::query();
        $eventQuery = HikvisionAccessEvent::with(['student.schoolClass', 'faceRects', 'access'])->orderBy('id', 'desc');

        // Multi-tenant check
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            if ($userSchoolIds->isNotEmpty()) {
                $studentQuery->whereHas('schoolClass.shift.branch', function ($b) use ($userSchoolIds) {
                    $b->whereIn('school_id', $userSchoolIds);
                });
                $attendanceQuery->whereHas('student.schoolClass.shift.branch', function ($b) use ($userSchoolIds) {
                    $b->whereIn('school_id', $userSchoolIds);
                });
                $eventQuery->whereHas('student.schoolClass.shift.branch', function ($b) use ($userSchoolIds) {
                    $b->whereIn('school_id', $userSchoolIds);
                });
            }
        }

        if ($schoolId) {
            $studentQuery->whereHas('schoolClass.shift.branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
            $attendanceQuery->whereHas('student.schoolClass.shift.branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
            $eventQuery->whereHas('student.schoolClass.shift.branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
        }

        if ($branchId) {
            $studentQuery->whereHas('schoolClass.shift', function ($b) use ($branchId) {
                $b->where('branch_id', $branchId);
            });
            $attendanceQuery->whereHas('student.schoolClass.shift', function ($b) use ($branchId) {
                $b->where('branch_id', $branchId);
            });
            $eventQuery->whereHas('student.schoolClass.shift', function ($b) use ($branchId) {
                $b->where('branch_id', $branchId);
            });
        }

        // Stats
        $totalStudents = (clone $studentQuery)->count();
        $presentToday = (clone $attendanceQuery)->where('date', $today)->count();
        $lateArrivals = (clone $attendanceQuery)->where('date', $today)->where('is_late', true)->count();
        $absent = max(0, $totalStudents - $presentToday);

        // Live Feed
        $recentEvents = $eventQuery->take(10)->get();

        // Monthly Statistics
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        $monthlyAttendance = (clone $attendanceQuery)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->selectRaw('date, count(*) as present, sum(case when is_late then 1 else 0 end) as late')
            ->groupBy('date')
            ->get()
            ->keyBy(function ($item) {
                return Carbon::parse($item->date)->format('Y-m-d');
            });

        $monthlyStats = [];
        $currentDate = clone $startOfMonth;
        $now = Carbon::now();
        while ($currentDate <= $now) {
            $dateStr = $currentDate->toDateString();
            $data = $monthlyAttendance->get($dateStr);

            $present = $data ? (int) $data->present : 0;
            $late = $data ? (int) $data->late : 0;

            $monthlyStats[] = [
                'date' => $currentDate->format('d.m'),
                'present' => $present,
                'absent' => max(0, $totalStudents - $present),
                'late' => $late,
                'on_time' => max(0, $present - $late),
            ];
            $currentDate->addDay();
        }

        $schoolsQuery = School::query();
        $branchesQuery = Branch::query();

        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            if ($userSchoolIds->isNotEmpty()) {
                $schoolsQuery->whereIn('id', $userSchoolIds);
                $branchesQuery->whereIn('school_id', $userSchoolIds);
            }
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'total_students' => $totalStudents,
                'present_today' => $presentToday,
                'late_arrivals' => $lateArrivals,
                'on_time_today' => max(0, $presentToday - $lateArrivals),
                'absent_today' => $absent,
            ],
            'monthly_stats' => $monthlyStats,
            'recent_events' => $recentEvents,
            'schools' => $schools,
            'branches' => $branches,
            'filters' => [
                'school_id' => $schoolId,
                'branch_id' => $branchId,
            ],
        ]);
    }
}
