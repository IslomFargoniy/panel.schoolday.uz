<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Services\AttendanceReport;
use App\Support\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function __construct(private AttendanceReport $report) {}

    public function index(Request $request)
    {
        $schoolIds = Tenant::isGlobalAdmin() ? collect() : Tenant::schoolIds();
        $filters = $this->report->filters($request);
        $paginated = $this->report->data($filters, true);

        // Multi-tenant accessible options
        $schoolsQuery = School::query();
        $branchesQuery = Branch::query();
        $shiftsQuery = Shift::with('branch');
        $classesQuery = SchoolClass::with('shift.branch');
        $studentsQuery = Student::where('status', 'active');

        if (! Tenant::isGlobalAdmin()) {
            $schoolsQuery->whereIn('id', $schoolIds);
            $branchesQuery->whereIn('school_id', $schoolIds);
            $shiftsQuery->whereHas('branch', function ($b) use ($schoolIds) {
                $b->whereIn('school_id', $schoolIds);
            });
            $classesQuery->whereHas('shift.branch', function ($b) use ($schoolIds) {
                $b->whereIn('school_id', $schoolIds);
            });
            $studentsQuery->whereHas('schoolClass.shift.branch', function ($b) use ($schoolIds) {
                $b->whereIn('school_id', $schoolIds);
            });
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();
        $shifts = $shiftsQuery->select('id', 'name', 'branch_id', 'start_time', 'end_time')->get();
        $classes = $classesQuery->select('id', 'name', 'shift_id')->orderBy('name')->get();
        $students = $studentsQuery->select('id', 'name', 'class_id')->orderBy('name')->get();

        $rangeTruncated = false;
        $effectiveEndDate = null;
        if ($filters['status'] === 'absent') {
            [, $effectiveEnd, $rangeTruncated] = $this->report->resolveAbsentRange($filters['start_date'], $filters['end_date']);
            $effectiveEndDate = $effectiveEnd->toDateString();
        }

        return Inertia::render('reports/index', [
            'range_truncated' => $rangeTruncated,
            'effective_end_date' => $rangeTruncated ? $effectiveEndDate : null,
            'attendances' => $paginated,
            'schools' => $schools,
            'branches' => $branches,
            'shifts' => $shifts,
            'classes' => $classes,
            'students' => $students,
            'filters' => $filters,
        ]);
    }

    public function export(Request $request)
    {
        $filters = $this->report->filters($request);
        $data = $this->report->data($filters, false);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendanceExport($data),
            'davomat_hisoboti_' . now()->format('Y-m-d_H-i') . '.xlsx'
        );
    }

    public function show($id)
    {
        $attendance = DailyAttendance::with(['student.schoolClass.shift.branch'])->findOrFail($id);
        $this->authorize('view', $attendance);

        $events = [];

        if ($attendance->student && $attendance->student->employeeNoString) {
            $events = \App\Models\HikvisionAccessEvent::query()->with('access')
                ->where('employeeNoString', $attendance->student->employeeNoString)
                ->whereHas('access', function ($query) use ($attendance) {
                    $query->whereDate('dateTime', $attendance->date);
                })
                ->get()
                ->sortBy(fn ($event) => $event->access?->dateTime)
                ->values();
        }

        $attendance->setAttribute('events', $events);

        return Inertia::render('reports/show', [
            'attendance' => $attendance,
        ]);
    }

    public function destroy($id)
    {
        $attendance = DailyAttendance::findOrFail($id);
        $this->authorize('delete', $attendance);

        $attendance->delete();

        return redirect()->route('reports.index')
            ->with('success', ['key' => 'crud.attendance_deleted']);
    }

    public function destroyEvent($id)
    {
        $event = \App\Models\HikvisionAccessEvent::findOrFail($id);
        $this->authorize('delete', $event);

        $event->faceRects()->delete();
        $event->delete();

        return back()->with('success', ['key' => 'crud.event_deleted']);
    }
}
