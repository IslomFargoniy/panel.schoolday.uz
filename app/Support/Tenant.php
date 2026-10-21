<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
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

    /**
     * Restrict a query to the user's schools; global admins are left unrestricted.
     * $relation is the path to the Branch (e.g. "schoolClass.shift.branch"), or null when the query is on branches.
     */
    public static function restrict(Builder $query, ?string $relation = null, ?User $user = null, string $column = 'school_id'): Builder
    {
        $user = $user ?? Auth::user();

        if (static::isGlobalAdmin($user)) {
            return $query;
        }

        $schoolIds = static::schoolIds($user);

        if ($relation === null) {
            return $query->whereIn($column, $schoolIds);
        }

        return $query->whereHas($relation, fn (Builder $b) => $b->whereIn('school_id', $schoolIds));
    }
}
