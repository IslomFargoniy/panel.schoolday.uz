<?php

namespace App\Policies;

use App\Models\SchoolClass;
use App\Models\User;
use App\Support\Tenant;

class SchoolClassPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, SchoolClass $schoolClass): bool
    {
        return Tenant::canAccessSchool($schoolClass->shift?->branch?->school_id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, SchoolClass $schoolClass): bool
    {
        return Tenant::canAccessSchool($schoolClass->shift?->branch?->school_id, $user);
    }

    public function delete(User $user, SchoolClass $schoolClass): bool
    {
        return Tenant::canAccessSchool($schoolClass->shift?->branch?->school_id, $user);
    }
}
