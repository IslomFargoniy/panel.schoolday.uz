<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;

        $today = \Carbon\Carbon::today()->toDateString();

        $query = Shift::with(['branch.school'])
            ->withCount('classes')
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
            }]);

        // Multi-tenant check
        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $query->whereHas('branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
            });
        }

        // Filter by school_id
        if ($request->filled('school_id')) {
            $schoolId = $request->input('school_id');
            $query->whereHas('branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
        }

        // Filter by branch_id
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter by search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $shifts = $query->latest()->paginate($limit);

        // Fetch accessible schools and branches for cascading filters
        $schoolsQuery = \App\Models\School::query();
        $branchesQuery = Branch::query();

        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $schoolsQuery->whereIn('id', $userSchoolIds);
            $branchesQuery->whereIn('school_id', $userSchoolIds);
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();

        return Inertia::render('shifts/index', [
            'shifts' => $shifts,
            'schools' => $schools,
            'branches' => $branches,
            'filters' => [
                'per_page' => $perPage,
                'school_id' => $request->school_id,
                'branch_id' => $request->branch_id,
                'search' => $request->search,
            ],
        ]);
    }

    public function store(\App\Http\Requests\ShiftRequest $request)
    {
        $validated = $request->validated();

        Shift::create($validated);

        return redirect()->back()->with('success', 'crud.created');
    }

    public function update(\App\Http\Requests\ShiftRequest $request, Shift $shift)
    {
        $validated = $request->validated();

        $shift->update($validated);

        return redirect()->back()->with('success', 'crud.updated');
    }

    public function destroy(Shift $shift)
    {
        try {
            $shift->delete();

            return redirect()->back()->with('success', 'crud.deleted');
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return redirect()->back()->with('error', 'crud.delete_shift_error');
            }

            return redirect()->back()->with('error', 'crud.error');
        }
    }
}
