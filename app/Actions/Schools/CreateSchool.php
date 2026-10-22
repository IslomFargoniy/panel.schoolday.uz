<?php

namespace App\Actions\Schools;

use App\Models\School;
use App\Models\User;

class CreateSchool
{
    /** The admin who creates a school is attached to it. */
    public function __invoke(array $data, User $creator): School
    {
        $school = School::create($data);
        $school->user_schools()->create(['user_id' => $creator->id]);

        return $school;
    }
}
