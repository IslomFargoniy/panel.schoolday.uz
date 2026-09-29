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
     * Sync events from ISUP device
     */
    public function sync(BranchDevice $branchDevice, \App\Services\Hikvision\HikvisionSyncService $syncService)
    {
        $result = $syncService->syncEventsFromDevice($branchDevice);
        if ($result['success'] ?? false) {
            return back()->with('success', $result['message'] ?? 'ISUP hodisalar muvaffaqiyatli sinxronlandi.');
        }
        return back()->with('error', $result['message'] ?? 'Sinxronizatsiyada xatolik yuz berdi.');
    }
}
