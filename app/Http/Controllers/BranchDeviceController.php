<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchDeviceRequest;
use App\Http\Requests\UpdateBranchDeviceRequest;
use App\Models\BranchDevice;
use App\Support\Tenant;
use Exception;

class BranchDeviceController extends Controller
{
    /**
     * Display a listing of devices across branches.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $schoolIds = Tenant::isGlobalAdmin() ? collect() : Tenant::schoolIds();
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;

        $query = BranchDevice::with(['branch.school'])->latest();

        // Multi-tenant check
        if (! Tenant::isGlobalAdmin()) {
            $query->whereHas('branch', function ($b) use ($schoolIds) {
                $b->whereIn('school_id', $schoolIds);
            });
        }

        if ($request->filled('school_id')) {
            $schoolId = $request->school_id;
            $query->whereHas('branch', function ($b) use ($schoolId) {
                $b->where('school_id', $schoolId);
            });
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('connection_type')) {
            $query->where('connection_type', $request->connection_type);
        }

        if ($request->filled('is_online')) {
            $isOnline = $request->is_online === '1' || $request->is_online === 'true';
            $query->where('is_online', $isOnline);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('mac_address', 'like', "%{$search}%")
                    ->orWhere('device_id', 'like', "%{$search}%");
            });
        }

        $devices = $query->paginate($limit)->withQueryString();

        $schoolsQuery = \App\Models\School::query();
        $branchesQuery = \App\Models\Branch::with('school');

        if (! Tenant::isGlobalAdmin()) {
            $schoolsQuery->whereIn('id', $schoolIds);
            $branchesQuery->whereIn('school_id', $schoolIds);
        }

        $schools = $schoolsQuery->select('id', 'name')->get();
        $branches = $branchesQuery->select('id', 'name', 'school_id')->get();

        return \Inertia\Inertia::render('devices/index', [
            'devices' => $devices,
            'schools' => $schools,
            'branches' => $branches,
            'filters' => [
                'search' => $request->search,
                'school_id' => $request->school_id,
                'branch_id' => $request->branch_id,
                'connection_type' => $request->connection_type,
                'is_online' => $request->is_online,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBranchDeviceRequest $request)
    {
        try {
            BranchDevice::create($request->validated());

            return back()->with('success', ['key' => 'crud.device_created']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BranchDevice store error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.device_save_error']);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchDeviceRequest $request, BranchDevice $branchDevice)
    {
        $this->authorize('update', $branchDevice);

        try {
            $branchDevice->update($request->validated());

            return back()->with('success', ['key' => 'crud.device_updated']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BranchDevice update error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.device_update_error']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BranchDevice $branchDevice)
    {
        $this->authorize('delete', $branchDevice);

        try {
            $branchDevice->delete();

            return back()->with('success', ['key' => 'crud.device_deleted']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BranchDevice destroy error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.device_delete_error']);
        }
    }
}
