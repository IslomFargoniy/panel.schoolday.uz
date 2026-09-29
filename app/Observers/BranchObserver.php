<?php

namespace App\Observers;

use App\Models\Branch;
use Illuminate\Support\Facades\Auth;

class BranchObserver
{
    /**
     * Handle the Branch "creating" event.
     */
    public function creating(Branch $branch): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            Auth::user()->user_schools()
                ->where('school_id', $branch->school_id)
                ->firstOrFail();
        }
    }

    /**
     * Handle the Branch "updating" event.
     */
    public function updating(Branch $branch): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            Auth::user()->user_schools()
                ->where('school_id', $branch->school_id)
                ->firstOrFail();
        }
    }

    /**
     * Handle the Branch "deleting" event.
     */
    public function deleting(Branch $branch): void
    {
        if (Auth::check() && !Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            Auth::user()->user_schools()
                ->where('school_id', $branch->school_id)
                ->firstOrFail();
        }
    }
}
