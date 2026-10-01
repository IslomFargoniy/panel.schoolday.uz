<?php

namespace App\Policies;

use App\Models\Branch;
use App\Models\User;
use App\Support\Tenant;

class BranchPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Branch $branch): bool
    {
        return Tenant::canAccessSchool($branch->school_id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, Branch $branch): bool
    {
        return Tenant::canAccessSchool($branch->school_id, $user);
    }

    public function delete(User $user, Branch $branch): bool
    {
        return Tenant::canAccessSchool($branch->school_id, $user);
    }
}
