<?php

namespace App\Policies;

use App\Models\Shift;
use App\Models\User;
use App\Support\Tenant;

class ShiftPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Shift $shift): bool
    {
        return Tenant::canAccessSchool($shift->branch?->school_id, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, Shift $shift): bool
    {
        return Tenant::canAccessSchool($shift->branch?->school_id, $user);
    }

    public function delete(User $user, Shift $shift): bool
    {
        return Tenant::canAccessSchool($shift->branch?->school_id, $user);
    }
}
