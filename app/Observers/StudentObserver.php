<?php

namespace App\Observers;

use App\Models\Student;
use Illuminate\Support\Facades\Auth;

class StudentObserver
{
    /**
     * Resolve the school_id for a student
     */
    protected function getSchoolId(Student $student): ?int
    {
        return $student->schoolClass?->shift?->branch?->school_id;
    }

    /**
     * Handle the Student "creating" event.
     */
    public function creating(Student $student): void
    {
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $schoolId = $this->getSchoolId($student);
            if ($schoolId && Auth::user()->user_schools()->exists()) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }

    /**
     * Handle the Student "updating" event.
     */
    public function updating(Student $student): void
    {
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $schoolId = $this->getSchoolId($student);
            if ($schoolId && Auth::user()->user_schools()->exists()) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }

    /**
     * Handle the Student "deleting" event.
     */
    public function deleting(Student $student): void
    {
        if (Auth::check() && ! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
            $schoolId = $this->getSchoolId($student);
            if ($schoolId && Auth::user()->user_schools()->exists()) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }
        }
    }
}
