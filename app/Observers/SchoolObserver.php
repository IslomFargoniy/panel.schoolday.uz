<?php

namespace App\Observers;

use App\Models\School;

class SchoolObserver
{
    /**
     * Handle the School "deleting" event.
     */
    public function deleting(School $school): void
    {
        $school->user_schools()->delete();
        $school->school_setting()->delete();
    }
}
