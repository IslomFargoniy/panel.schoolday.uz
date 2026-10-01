<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSchoolActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Allow guests and global admins
        if (! $user || Tenant::isGlobalAdmin($user)) {
            return $next($request);
        }

        // Allow settings, profile, 2FA, logout, and the inactive notice route itself
        if ($request->routeIs(
            'school.inactive',
            'logout',
            'settings.*',
            'profile.*',
            'password.*',
            'two-factor.*'
        )) {
            return $next($request);
        }

        // Get user's attached schools
        $schools = $user->schools;

        // If user has schools attached, check if all are inactive or expired
        if ($schools->isNotEmpty()) {
            $hasActive = $schools->contains(function ($school) {
                $isActive = (int) $school->status === 1;
                $isValid = ! $school->valid_date || ! Carbon::parse($school->valid_date)->isPast();

                return $isActive && $isValid;
            });

            if (! $hasActive) {
                if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                    return response()->json([
                        'message' => __('school_inactive_or_expired', 'Siz biriktirilgan maktablarning faoliyati to‘xtatilgan yoki muddati tugagan.'),
                    ], 403);
                }

                return redirect()->route('school.inactive');
            }
        }

        return $next($request);
    }
}
