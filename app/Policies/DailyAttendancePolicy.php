<?php

namespace App\Policies;

use App\Models\DailyAttendance;
use App\Models\User;
use App\Support\Tenant;

class DailyAttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, DailyAttendance $dailyAttendance): bool
    {
        $schoolId = $dailyAttendance->student?->schoolClass?->shift?->branch?->school_id;

        return Tenant::canAccessSchool($schoolId, $user);
    }

    public function create(User $user): bool
    {
        return Tenant::isGlobalAdmin($user) || Tenant::schoolIds($user)->isNotEmpty();
    }

    public function update(User $user, DailyAttendance $dailyAttendance): bool
    {
        $schoolId = $dailyAttendance->student?->schoolClass?->shift?->branch?->school_id;

        return Tenant::canAccessSchool($schoolId, $user);
    }

    public function delete(User $user, DailyAttendance $dailyAttendance): bool
    {
        $schoolId = $dailyAttendance->student?->schoolClass?->shift?->branch?->school_id;

        return Tenant::canAccessSchool($schoolId, $user);
    }
}
