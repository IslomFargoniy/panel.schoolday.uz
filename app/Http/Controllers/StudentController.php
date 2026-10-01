<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use App\Support\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;
        $schoolId = $request->input('school_id');
        $branchId = $request->input('branch_id');
        $shiftId = $request->input('shift_id');
        $classId = $request->input('class_id');
        $status = $request->input('status');
        $search = $request->input('search');

        $query = Student::with(['schoolClass.shift.branch.school'])->orderBy('name', 'asc');

        // Multi-tenant check: non-admins only see students from their schools
        if (! Tenant::isGlobalAdmin()) {
            $query->whereHas('schoolClass.shift.branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
        }

        if ($schoolId) {
            $query->whereHas('schoolClass.shift.branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
        }

        if ($branchId) {
            $query->whereHas('schoolClass.shift', function ($s) use ($branchId) {
                $s->where('branch_id', $branchId);
            });
        }

        if ($shiftId) {
            $query->whereHas('schoolClass', function ($c) use ($shiftId) {
                $c->where('shift_id', $shiftId);
            });
        }

        if ($classId) {
            $query->where('class_id', $classId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employeeNoString', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Available options for cascading
        $schoolsQuery = School::query();
        $branchesQuery = Branch::query();
        $shiftsQuery = Shift::with('branch');
        $classesQuery = SchoolClass::with('shift.branch');

        if (! Tenant::isGlobalAdmin()) {
            $schoolsQuery->whereIn('id', Tenant::schoolIds());
            $branchesQuery->whereIn('school_id', Tenant::schoolIds());
            $shiftsQuery->whereHas('branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
            $classesQuery->whereHas('shift.branch', function ($b) {
                $b->whereIn('school_id', Tenant::schoolIds());
            });
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();
        $shifts = $shiftsQuery->select('id', 'name', 'branch_id')->get();
        $classes = $classesQuery->select('id', 'name', 'shift_id')->orderBy('name')->get();

        return Inertia::render('students/index', [
            'students' => $query->paginate($limit),
            'schools' => $schools,
            'branches' => $branches,
            'shifts' => $shifts,
            'classes' => $classes,
            'filters' => [
                'school_id' => $schoolId,
                'branch_id' => $branchId,
                'shift_id' => $shiftId,
                'class_id' => $classId,
                'status' => $status,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(\App\Http\Requests\StudentRequest $request)
    {
        $validated = $request->validated();

        $class = SchoolClass::with('shift.branch')->findOrFail($validated['class_id']);
        Tenant::authorizeSchool($class->shift?->branch?->school_id);

        if ($request->hasFile('face_image')) {
            $path = $request->file('face_image')->store('faces', 'public');
            $validated['face_image'] = '/storage/' . $path;
        }

        Student::create($validated);

        return redirect()->back()->with('success', 'crud.created');
    }

    public function update(\App\Http\Requests\StudentRequest $request, Student $student)
    {
        $this->authorize('update', $student);

        $validated = $request->validated();

        if (isset($validated['class_id']) && (int) $validated['class_id'] !== (int) $student->class_id) {
            $newClass = SchoolClass::with('shift.branch')->findOrFail($validated['class_id']);
            Tenant::authorizeSchool($newClass->shift?->branch?->school_id);
        }

        if ($request->hasFile('face_image')) {
            $path = $request->file('face_image')->store('faces', 'public');
            $validated['face_image'] = '/storage/' . $path;
        } else {
            unset($validated['face_image']);
        }

        $student->update($validated);

        return redirect()->back()->with('success', 'crud.updated');
    }

    public function destroy(Student $student)
    {
        $this->authorize('delete', $student);

        try {
            $student->delete();

            return redirect()->back()->with('success', 'crud.deleted');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return redirect()->back()->with('error', ['key' => 'crud.student_has_relations']);
            }

            return redirect()->back()->with('error', 'crud.error');
        }
    }

    public function template()
    {
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\StudentsTemplateExport,
            'shablon_oquvchilar.xlsx'
        );
    }

    public function import(Request $request)
    {
        $request->validate([
            'excel_file' => 'required|file|mimes:xlsx,xls,csv',
            'class_id' => 'required|exists:classes,id',
        ]);

        $classId = $request->input('class_id');
        $class = SchoolClass::with('shift.branch')->findOrFail($classId);
        Tenant::authorizeSchool($class->shift?->branch?->school_id);

        $file = $request->file('excel_file');

        // Save the file first so it can be processed in the background queue
        $path = $file->store('imports');

        // Queue the import process in the background (StudentsImport implements ShouldQueue)
        \Maatwebsite\Excel\Facades\Excel::queueImport(new \App\Imports\StudentsImport($classId), $path);

        return redirect()->back()->with('success', ['key' => 'crud.students_imported_queued']);
    }

    public function hikvisionEvents(Student $student)
    {
        $this->authorize('view', $student);

        $events = \App\Models\HikvisionAccessEvent::with('access')
            ->where('employeeNoString', $student->employeeNoString)
            ->latest()
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'student' => $student,
            'events' => $events,
        ]);
    }
}
