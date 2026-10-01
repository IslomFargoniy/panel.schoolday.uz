<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\School;
use App\Support\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;

        $today = \Carbon\Carbon::today()->toDateString();

        $query = Branch::withCount('shifts')
            ->with([
                'school',
                'devices',
                'shifts' => function ($q) use ($today) {
                    $q->withCount('classes')
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
                },
            ]);

        // Filter by school_id if passed
        if ($request->filled('school_id')) {
            $query->where('school_id', $request->school_id);
        }

        // Filter by search if passed
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Multi-tenant check: non-admins only see branches of their schools
        if (! Tenant::isGlobalAdmin()) {
            $query->whereIn('school_id', Tenant::schoolIds());
        }

        $branches = $query->latest()
            ->paginate($limit)
            ->through(function ($branch) {
                $branch->classes_count = $branch->shifts->sum('classes_count');
                $branch->total_students = $branch->shifts->sum('total_students');
                $branch->present_students = $branch->shifts->sum('present_students');
                $branch->on_time_students = $branch->shifts->sum('on_time_students');
                $branch->late_students = $branch->shifts->sum('late_students');
                $branch->mac_address_list = $branch->devices->pluck('mac_address')->filter()->toArray();
                unset($branch->shifts);

                return $branch;
            });

        // List schools accessible to user
        $schoolsQuery = School::query();
        if (! Tenant::isGlobalAdmin()) {
            $schoolsQuery->whereIn('id', Tenant::schoolIds());
        }
        $schools = $schoolsQuery->select('id', 'name', 'branch_limit')->get();

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'schools' => $schools,
            'filters' => [
                'per_page' => $perPage,
                'school_id' => $request->school_id,
                'search' => $request->search,
            ],
        ]);
    }

    public function show(Request $request, Branch $branch)
    {
        $this->authorize('view', $branch);

        $branch->load([
            'school',
            'devices' => fn ($q) => $q->latest(),
            'shifts' => function ($q) {
                $q->withCount('classes')
                    ->with(['classes' => fn ($c) => $c->withCount('students')]);
            },
        ]);

        $shiftId = $request->input('shift_id');
        $classId = $request->input('class_id');

        $studentsQuery = \App\Models\Student::with(['schoolClass.shift'])
            ->whereHas('schoolClass.shift', function ($q) use ($branch) {
                $q->where('branch_id', $branch->id);
            });

        if ($shiftId) {
            $studentsQuery->whereHas('schoolClass', function ($q) use ($shiftId) {
                $q->where('shift_id', $shiftId);
            });
        }

        if ($classId) {
            $studentsQuery->where('class_id', $classId);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $studentsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('employeeNoString', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $students = $studentsQuery->latest()->paginate($request->input('per_page', 20))->withQueryString();

        $branchClasses = \App\Models\SchoolClass::with('shift')
            ->withCount('students')
            ->whereHas('shift', fn ($q) => $q->where('branch_id', $branch->id))
            ->orderBy('name')
            ->get();

        return Inertia::render('branches/show', [
            'branch' => $branch,
            'students' => $students,
            'branchClasses' => $branchClasses,
            'filters' => [
                'search' => $request->search,
                'shift_id' => $shiftId,
                'class_id' => $classId,
                'per_page' => $request->input('per_page', 20),
            ],
        ]);
    }

    public function store(\App\Http\Requests\BranchRequest $request)
    {
        $validated = $request->validated();
        $macAddresses = $validated['mac_addresses'] ?? [];
        unset($validated['mac_addresses']);

        // Determine school_id
        $schoolId = $validated['school_id'] ?? null;
        if (! $schoolId && Auth::check()) {
            $schoolId = Auth::user()->user_schools()->value('school_id');
        }
        if (! $schoolId && Tenant::isGlobalAdmin()) {
            $schoolId = School::first()?->id;
        }

        Tenant::authorizeSchool($schoolId);

        $school = School::findOrFail($schoolId);
        if ($school->branch_limit !== null && $school->branches()->count() >= $school->branch_limit) {
            return redirect()->back()->with('error', ['key' => 'crud.branch_limit_reached', 'params' => ['limit' => $school->branch_limit]]);
        }
        $validated['school_id'] = $schoolId;

        $branch = Branch::create($validated);

        $this->syncMacAddresses($branch, $macAddresses);

        return redirect()->back()->with('success', ['key' => 'crud.branch_created']);
    }

    public function update(\App\Http\Requests\BranchRequest $request, Branch $branch)
    {
        $this->authorize('update', $branch);

        $validated = $request->validated();
        $macAddresses = $validated['mac_addresses'] ?? [];
        unset($validated['mac_addresses']);

        if (isset($validated['school_id']) && (int) $validated['school_id'] !== (int) $branch->school_id) {
            Tenant::authorizeSchool((int) $validated['school_id']);
            $newSchool = School::findOrFail($validated['school_id']);
            if ($newSchool->branch_limit !== null && $newSchool->branches()->count() >= $newSchool->branch_limit) {
                return redirect()->back()->with('error', ['key' => 'crud.branch_limit_reached', 'params' => ['limit' => $newSchool->branch_limit]]);
            }
        }

        $branch->update($validated);

        $this->syncMacAddresses($branch, $macAddresses);

        return redirect()->back()->with('success', ['key' => 'crud.branch_updated']);
    }

    public function destroy(Branch $branch)
    {
        $this->authorize('delete', $branch);
        try {
            $branch->delete();

            return redirect()->back()->with('success', ['key' => 'crud.branch_deleted']);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return redirect()->back()->with('error', ['key' => 'crud.branch_has_relations']);
            }

            return redirect()->back()->with('error', ['key' => 'crud.error']);
        }
    }

    private function syncMacAddresses(Branch $branch, array $macAddresses): void
    {
        $clean = collect($macAddresses)
            ->map(fn ($m) => strtoupper(trim($m)))
            ->filter(fn ($m) => $m !== '')
            ->unique()
            ->values()
            ->toArray();

        // Delete old HTTP listening devices not in new list (preserve ISUP devices)
        $branch->devices()->where('connection_type', 'http_listening')->whereNotIn('mac_address', $clean)->delete();

        // Create new ones
        foreach ($clean as $mac) {
            $branch->devices()->firstOrCreate(
                ['mac_address' => $mac],
                [
                    'name' => 'Hikvision Terminal',
                    'device_id' => 'branch' . $branch->id,
                    'connection_type' => 'http_listening',
                    'status' => true,
                ]
            );
        }
    }
}
