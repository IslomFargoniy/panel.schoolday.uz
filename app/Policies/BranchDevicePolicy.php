<?php

namespace App\Policies;

use App\Models\BranchDevice;
use App\Models\User;
use App\Support\Tenant;

class BranchDevicePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, BranchDevice $branchDevice): bool
    {
        return Tenant::canAccessSchool($branchDevice->branch?->school_id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, BranchDevice $branchDevice): bool
    {
        return Tenant::canAccessSchool($branchDevice->branch?->school_id, $user);
    }

    public function delete(User $user, BranchDevice $branchDevice): bool
    {
        return Tenant::canAccessSchool($branchDevice->branch?->school_id, $user);
    }
}
