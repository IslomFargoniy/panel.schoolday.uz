<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function all()
    {
        return response()->json(Student::all());
    }

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
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            $query->whereHas('schoolClass.shift.branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
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

        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            $schoolsQuery->whereIn('id', $userSchoolIds);
            $branchesQuery->whereIn('school_id', $userSchoolIds);
            $shiftsQuery->whereHas('branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
            });
            $classesQuery->whereHas('shift.branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
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

        if ($request->hasFile('face_image')) {
            $path = $request->file('face_image')->store('faces', 'public');
            $validated['face_image'] = '/storage/' . $path;
        }

        $student = Student::create($validated);

        if (! isset($validated['employeeNoString']) || empty($validated['employeeNoString'])) {
            $student->update(['employeeNoString' => (string) $student->id]);
        }

        return redirect()->back()->with('success', 'crud.created');
    }

    public function update(\App\Http\Requests\StudentRequest $request, Student $student)
    {
        $validated = $request->validated();

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
        try {
            $student->delete();

            return redirect()->back()->with('success', 'crud.deleted');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return redirect()->back()->with('error', 'O\'chirish mumkin emas. Bu o\'quvchiga bog\'langan ma\'lumotlar (masalan: davomat) mavjud!');
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
        $file = $request->file('excel_file');

        // Background queue processing requires the file to be saved first
        $path = $file->store('imports');

        // Queue the import process in the background
        \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\StudentsImport($classId), $path);

        return redirect()->back()->with('success', "O'quvchilarni yuklash orqa fonda boshlandi. Sahifani birozdan so'ng yangilang!");
    }

    public function hikvisionEvents(Student $student)
    {
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
