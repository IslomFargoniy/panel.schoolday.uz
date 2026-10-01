<?php

namespace App\Observers;

use App\Jobs\SyncAllStudentsToDeviceJob;
use App\Models\BranchDevice;

class BranchDeviceObserver
{
    /**
     * Handle the BranchDevice "created" event.
     */
    public function created(BranchDevice $branchDevice): void
    {
        if ($branchDevice->status && $branchDevice->connection_type === 'isup' && ! empty($branchDevice->device_id)) {
            SyncAllStudentsToDeviceJob::dispatch($branchDevice->id)->afterCommit();
        }
    }

    /**
     * Handle the BranchDevice "updated" event.
     */
    public function updated(BranchDevice $branchDevice): void
    {
        if ($branchDevice->status && $branchDevice->connection_type === 'isup' && ! empty($branchDevice->device_id)) {
            if ($branchDevice->wasChanged('status') || $branchDevice->wasChanged('connection_type') || $branchDevice->wasChanged('device_id')) {
                SyncAllStudentsToDeviceJob::dispatch($branchDevice->id)->afterCommit();
            }
        }
    }
}
