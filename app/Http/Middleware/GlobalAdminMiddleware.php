<?php

namespace App\Http\Middleware;

use App\Support\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Admin or Superadmin only (managing schools and their users). */
class GlobalAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Tenant::isGlobalAdmin($request->user())) {
            abort(403, 'Ruxsat etilmagan');
        }

        return $next($request);
    }
}
