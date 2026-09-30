<?php

namespace App\Observers;

use App\Models\School;
use Illuminate\Support\Facades\Auth;

class SchoolObserver
{
    /**
     * Handle the School "creating" event.
     */
    public function creating(School $school): void
    {
        // Only Admin or Superadmin can create schools
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            abort(403, 'Unauthorized to create school.');
        }
    }

    /**
     * Handle the School "updating" event.
     */
    public function updating(School $school): void
    {
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            Auth::user()->user_schools()
                ->where('school_id', $school->id)
                ->firstOrFail();
        }
    }

    /**
     * Handle the School "deleting" event.
     */
    public function deleting(School $school): void
    {
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            abort(403, 'Only administrators can delete a school.');
        }

        $school->user_schools()->delete();
        $school->school_setting()->delete();
    }
}
