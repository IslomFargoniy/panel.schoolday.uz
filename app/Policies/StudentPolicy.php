<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;
use App\Support\Tenant;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Student $student): bool
    {
        return Tenant::canAccessSchool($student->schoolClass?->shift?->branch?->school_id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, Student $student): bool
    {
        return Tenant::canAccessSchool($student->schoolClass?->shift?->branch?->school_id, $user);
    }

    public function delete(User $user, Student $student): bool
    {
        return Tenant::canAccessSchool($student->schoolClass?->shift?->branch?->school_id, $user);
    }
}
