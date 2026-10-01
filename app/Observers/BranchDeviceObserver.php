<?php

namespace App\Observers;

use App\Models\BranchDevice;
use App\Services\Hikvision\HikvisionSyncService;
use Exception;
use Illuminate\Support\Facades\Log;

class BranchDeviceObserver
{
    /**
     * Handle the BranchDevice "created" event.
     */
    public function created(BranchDevice $branchDevice): void
    {
        if ($branchDevice->status && $branchDevice->connection_type === 'isup' && ! empty($branchDevice->device_id)) {
            try {
                app(HikvisionSyncService::class)->syncAllStudentsToDevice($branchDevice);
            } catch (Exception $e) {
                Log::warning('BranchDeviceObserver initial sync failed: ' . $e->getMessage());
            }
        }
    }
}
