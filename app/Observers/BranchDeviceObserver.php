<?php

namespace App\Observers;

use App\Models\BranchDevice;
use Illuminate\Support\Facades\Auth;

class BranchDeviceObserver
{
    /**
     * Handle the BranchDevice "creating" event.
     */
    public function creating(BranchDevice $branchDevice): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $schoolId = $branchDevice->branch?->school_id;
            if ($schoolId) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }

    /**
     * Handle the BranchDevice "updating" event.
     */
    public function updating(BranchDevice $branchDevice): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $schoolId = $branchDevice->branch?->school_id;
            if ($schoolId) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }

    /**
     * Handle the BranchDevice "deleting" event.
     */
    public function deleting(BranchDevice $branchDevice): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            $schoolId = $branchDevice->branch?->school_id;
            if ($schoolId) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }
}
