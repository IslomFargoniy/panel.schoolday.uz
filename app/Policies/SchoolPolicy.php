<?php

namespace App\Policies;

use App\Models\School;
use App\Models\User;
use App\Support\Tenant;

class SchoolPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, School $school): bool
    {
        return Tenant::canAccessSchool($school->id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user);
    }

    public function update(User $user, School $school): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::canAccessSchool($school->id, $user);
    }

    public function delete(User $user, School $school): bool
    {
        return Tenant::isGlobalAdmin($user);
    }
}
