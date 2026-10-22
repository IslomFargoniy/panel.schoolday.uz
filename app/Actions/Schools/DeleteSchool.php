<?php

namespace App\Actions\Schools;

use App\Actions\DeleteRecord;
use App\Exceptions\ActionFailed;
use App\Models\School;
use App\Models\Student;

class DeleteSchool
{
    /** A school that still has students is never deleted (its attendance history would go with it). */
    public function __invoke(School $school): void
    {
        $hasStudents = Student::whereHas('schoolClass.shift.branch', fn ($q) => $q->where('school_id', $school->id))->exists();

        if ($hasStudents || $school->branches()->exists()) {
            throw new ActionFailed('crud.cannot_delete_school_with_data');
        }

        DeleteRecord::run($school, 'crud.school_delete_error');
    }
}
