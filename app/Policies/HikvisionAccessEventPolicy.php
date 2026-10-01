<?php

namespace App\Policies;

use App\Models\HikvisionAccessEvent;
use App\Models\User;
use App\Support\Tenant;

class HikvisionAccessEventPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, HikvisionAccessEvent $event): bool
    {
        $schoolId = $event->student?->schoolClass?->shift?->branch?->school_id
            ?? $event->device?->branch?->school_id;

        return Tenant::canAccessSchool($schoolId, $user);
    }

    public function delete(User $user, HikvisionAccessEvent $event): bool
    {
        $schoolId = $event->student?->schoolClass?->shift?->branch?->school_id
            ?? $event->device?->branch?->school_id;

        return Tenant::canAccessSchool($schoolId, $user);
    }
}
