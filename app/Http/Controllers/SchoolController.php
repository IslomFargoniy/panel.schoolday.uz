<?php

namespace App\Http\Controllers;

use App\Actions\Schools\CreateSchool;
use App\Actions\Schools\DeleteSchool;
use App\Http\Requests\StoreSchoolRequest;
use App\Http\Requests\UpdateSchoolRequest;
use App\Models\School;
use App\Support\Tenant;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SchoolController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $schoolIds = Tenant::isGlobalAdmin() ? collect() : Tenant::schoolIds();
        $per_page = $request->input('per_page', 15);

        $query = School::with([
            'school_setting',
            'user_schools.user',
        ])
            ->withCount(['branches']);

        if ($request->filled('status')) {
            $query->where('status', (bool) $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        if (! Tenant::isGlobalAdmin()) {
            $query->whereIn('id', $schoolIds);
        }

        $schools = $query->paginate($per_page);

        return Inertia::render('school/index', [
            'school' => $schools,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'per_page' => $per_page,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSchoolRequest $request, CreateSchool $create)
    {
        try {
            $create($request->validated(), $request->user());
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('School create error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.school_create_error']);
        }

        return redirect()->back()->with('success', ['key' => 'crud.school_created']);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, School $school)
    {
        $this->authorize('view', $school);

        $school->load([
            'branches.devices',
            'school_setting',
            'user_schools.user',
        ]);

        return redirect()->route('branches.index', ['school_id' => $school->id]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSchoolRequest $request, School $school)
    {
        $this->authorize('update', $school);

        try {
            $school->update($request->validated());

            return redirect()->back()->with('success', ['key' => 'crud.school_updated']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('School update error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.school_update_error']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(School $school, DeleteSchool $delete)
    {
        $this->authorize('delete', $school);

        $delete($school);

        return redirect()->back()->with('success', ['key' => 'crud.school_deleted']);
    }
}
