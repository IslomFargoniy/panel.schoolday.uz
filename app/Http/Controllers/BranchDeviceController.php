<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBranchDeviceRequest;
use App\Http\Requests\UpdateBranchDeviceRequest;
use App\Models\BranchDevice;
use Exception;
use Illuminate\Validation\ValidationException;

class BranchDeviceController extends Controller
{
    /**
     * Display a listing of devices across branches.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $perPage = $request->input('per_page', '20');
        $limit = $perPage === 'all' ? 100000 : (int) $perPage;

        $query = BranchDevice::with(['branch.school'])->latest();

        // Multi-tenant check
        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $query->whereHas('branch', function ($b) use ($userSchoolIds) {
                $b->whereIn('school_id', $userSchoolIds);
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

        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $schoolsQuery->whereIn('id', $userSchoolIds);
            $branchesQuery->whereIn('school_id', $userSchoolIds);
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

            return back()->with('success', 'Qurilma muvaffaqiyatli qo\'shildi.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBranchDeviceRequest $request, BranchDevice $branchDevice)
    {
        try {
            $branchDevice->update($request->validated());

            return back()->with('success', 'Qurilma ma\'lumotlari yangilandi.');
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(BranchDevice $branchDevice)
    {
        try {
            $branchDevice->delete();

            return back()->with('success', 'Qurilma muvaffaqiyatli o\'chirildi.');
        } catch (Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage()],
            ]);
        }
    }

    /**
     * Sync events from ISUP device and push branch students/faces to device
     */
    public function sync(BranchDevice $branchDevice, \App\Services\Hikvision\HikvisionSyncService $syncService)
    {
        $eventResult = $syncService->syncEventsFromDevice($branchDevice);
        $studentResult = $syncService->syncAllStudentsToDevice($branchDevice);

        $eventCount = (int) ($eventResult['synced_count'] ?? 0);
        $studentCount = (int) ($studentResult['synced_count'] ?? 0);

        $msg = "Muvaffaqiyatli sinxronlandi! Qurilmaga {$studentCount} ta o‘quvchi yuklandi, {$eventCount} ta yangi hodisa qabul qilindi.";

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'synced_count' => $eventCount,
                'students_count' => $studentCount,
            ]);
        }

        return back()->with('success', $msg);
    }
}
