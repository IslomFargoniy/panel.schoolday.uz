<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class Tenant
{
    /**
     * Check if the given or authenticated user is a global admin (Admin or Superadmin).
     */
    public static function isGlobalAdmin(?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (! $user) {
            return false;
        }

        return $user->hasRole('Admin') || $user->hasRole('Superadmin');
    }

    /**
     * Get the collection of school IDs the user is attached to.
     */
    public static function schoolIds(?User $user = null): Collection
    {
        $user = $user ?? Auth::user();

        if (! $user) {
            return collect();
        }

        return $user->user_schools()->pluck('school_id');
    }

    /**
     * Determine if user has access to the given school.
     */
    public static function canAccessSchool(?int $schoolId, ?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        if (! $user) {
            return false;
        }

        if (static::isGlobalAdmin($user)) {
            return true;
        }

        if ($schoolId === null) {
            return false;
        }

        return $user->user_schools()->where('school_id', $schoolId)->exists();
    }

    /**
     * Authorize that the user can access the given school, or abort with 403.
     */
    public static function authorizeSchool(?int $schoolId, ?User $user = null): void
    {
        if (! static::canAccessSchool($schoolId, $user)) {
            abort(403, __('Ushbu maktabga kirish huquqi yo‘q.'));
        }
    }
}
