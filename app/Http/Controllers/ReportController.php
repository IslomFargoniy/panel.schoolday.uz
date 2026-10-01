<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DailyAttendance;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Support\Tenant;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = $this->getFilters($request);
        $paginated = $this->getAttendanceData($filters, true);

        // Multi-tenant accessible options
        $schoolsQuery = School::query();
        $branchesQuery = Branch::query();
        $shiftsQuery = Shift::with('branch');
        $classesQuery = SchoolClass::with('shift.branch');
        $studentsQuery = Student::where('status', 'active');

        if (! Tenant::isGlobalAdmin()) {
            $schoolsQuery->whereIn('id', Tenant::schoolIds());
            $branchesQuery->whereIn('school_id', Tenant::schoolIds());
            $shiftsQuery->whereHas('branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
            $classesQuery->whereHas('shift.branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
            $studentsQuery->whereHas('schoolClass.shift.branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();
        $shifts = $shiftsQuery->select('id', 'name', 'branch_id', 'start_time', 'end_time')->get();
        $classes = $classesQuery->select('id', 'name', 'shift_id')->orderBy('name')->get();
        $students = $studentsQuery->select('id', 'name', 'class_id')->orderBy('name')->get();

        return Inertia::render('reports/index', [
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
        $filters = $this->getFilters($request);
        $data = $this->getAttendanceData($filters, false);

        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AttendanceExport($data),
            'davomat_hisoboti_' . now()->format('Y-m-d_H-i') . '.xlsx'
        );
    }

    private function getFilters(Request $request)
    {
        return [
            'start_date' => $request->input('start_date', Carbon::today()->toDateString()),
            'end_date' => $request->input('end_date', Carbon::today()->toDateString()),
            'school_id' => $request->input('school_id'),
            'branch_id' => $request->input('branch_id'),
            'shift_id' => $request->input('shift_id'),
            'class_id' => $request->input('class_id'),
            'student_id' => $request->input('student_id'),
            'status' => $request->input('status', 'all'),
            'per_page' => $request->input('per_page', '20'),
        ];
    }

    private function getAttendanceData(array $filters, $paginate = true)
    {
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
            $query = Student::where('status', 'active')
                ->with(['schoolClass.shift.branch.school'])
                ->whereDoesntHave('attendances', function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate]);
                });

            // Multi-tenant check
            if (! Tenant::isGlobalAdmin()) {
                $query->whereHas('schoolClass.shift.branch', function ($b) {
                    $b->whereIn('school_id', Tenant::schoolIds());
                });
            }

            if ($studentId) {
                $query->where('id', $studentId);
            } else {
                if ($classId) {
                    $query->where('class_id', $classId);
                } elseif ($shiftId) {
                    $query->whereHas('schoolClass', function ($q) use ($shiftId) {
                        $q->where('shift_id', $shiftId);
                    });
                } elseif ($branchId) {
                    $query->whereHas('schoolClass.shift', function ($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    });
                } elseif ($schoolId) {
                    $query->whereHas('schoolClass.shift.branch', function ($q) use ($schoolId) {
                        $q->where('school_id', $schoolId);
                    });
                }
            }

            if ($paginate) {
                $results = $query->paginate($limit);
                $collection = $results->getCollection();
            } else {
                $results = $query->get();
                $collection = $results;
            }

            $collection->transform(function ($student) use ($startDate) {
                $item = new DailyAttendance([
                    'date' => clone Carbon::parse($startDate),
                ]);
                $item->id = 'absent-' . $student->id;
                $item->setRelation('student', $student);
                $item->is_absent_placeholder = true;

                return $item;
            });

            return $results;
        } else {
            $query = DailyAttendance::with(['student.schoolClass.shift.branch.school'])
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->orderBy('first_check_in', 'desc');

            // Multi-tenant check
            if (! Tenant::isGlobalAdmin()) {
                $query->whereHas('student.schoolClass.shift.branch', function ($b) {
                    $b->whereIn('school_id', Tenant::schoolIds());
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
            ->with('success', 'Attendance record deleted successfully');
    }

    public function destroyEvent($id)
    {
        $event = \App\Models\HikvisionAccessEvent::findOrFail($id);
        $this->authorize('delete', $event);

        $event->faceRects()->delete();
        $event->delete();

        return back()->with('success', 'Access event deleted successfully');
    }
}
