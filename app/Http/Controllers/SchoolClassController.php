<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SchoolClassController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;
        $schoolId = $request->input('school_id');
        $branchId = $request->input('branch_id');
        $shiftId = $request->input('shift_id');
        $search = $request->input('search');
        $today = \Carbon\Carbon::today()->toDateString();

        $query = SchoolClass::with(['shift.branch.school'])
            ->withCount(['students as total_students' => function ($q) {
                $q->where('status', 'active');
            }])
            ->withCount(['students as present_students' => function ($q) use ($today) {
                $q->where('status', 'active')->whereHas('attendances', function ($a) use ($today) {
                    $a->whereDate('date', $today);
                });
            }])
            ->withCount(['students as on_time_students' => function ($q) use ($today) {
                $q->where('status', 'active')->whereHas('attendances', function ($a) use ($today) {
                    $a->whereDate('date', $today)->where('is_late', false);
                });
            }])
            ->withCount(['students as late_students' => function ($q) use ($today) {
                $q->where('status', 'active')->whereHas('attendances', function ($a) use ($today) {
                    $a->whereDate('date', $today)->where('is_late', true);
                });
            }])
            ->orderBy('name', 'asc');

        // Multi-tenant check
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            $query->whereHas('shift.branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
            });
        }

        if ($schoolId) {
            $query->whereHas('shift.branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
        }

        if ($branchId) {
            $query->whereHas('shift', function ($s) use ($branchId) {
                $s->where('branch_id', $branchId);
            });
        }

        if ($shiftId) {
            $query->where('shift_id', $shiftId);
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Accessible options for cascading filters
        $schoolsQuery = School::query();
        $branchesQuery = Branch::query();
        $shiftsQuery = Shift::with('branch');

        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = Auth::user()->user_schools()->pluck('school_id');
            $schoolsQuery->whereIn('id', $userSchoolIds);
            $branchesQuery->whereIn('school_id', $userSchoolIds);
            $shiftsQuery->whereHas('branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
            });
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();
        $shifts = $shiftsQuery->select('id', 'name', 'branch_id', 'start_time', 'end_time')->get();

        return Inertia::render('classes/index', [
            'classes' => $query->paginate($limit),
            'schools' => $schools,
            'branches' => $branches,
            'shifts' => $shifts,
            'filters' => [
                'school_id' => $schoolId,
                'branch_id' => $branchId,
                'shift_id' => $shiftId,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(\App\Http\Requests\SchoolClassRequest $request)
    {
        $validated = $request->validated();

        SchoolClass::create($validated);

        return redirect()->back()->with('success', 'crud.created');
    }

    public function update(\App\Http\Requests\SchoolClassRequest $request, SchoolClass $schoolClass)
    {
        $validated = $request->validated();

        $schoolClass->update($validated);

        return redirect()->back()->with('success', 'crud.updated');
    }

    public function destroy(SchoolClass $schoolClass)
    {
        try {
            $schoolClass->delete();

            return redirect()->back()->with('success', 'crud.deleted');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return redirect()->back()->with('error', 'crud.delete_class_error');
            }

            return redirect()->back()->with('error', 'crud.error');
        }
    }
}
