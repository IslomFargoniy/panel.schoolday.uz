<?php

namespace App\Observers;

use App\Jobs\SyncAllStudentsToDeviceJob;
use App\Models\BranchDevice;

class BranchDeviceObserver
{
    /**
     * An ISUP device saved without a Device ID gets its own unique ID and key, so every terminal
     * logs in with different credentials. A typed ID is kept as given; existing devices are untouched.
     */
    public function creating(BranchDevice $branchDevice): void
    {
        if ($branchDevice->connection_type !== 'isup' || filled($branchDevice->device_id)) {
            return;
        }

        $branchDevice->device_id = BranchDevice::generateIsupId();
        if (blank($branchDevice->encryption_key)) {
            $branchDevice->encryption_key = BranchDevice::generateIsupKey();
        }
    }

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
