<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->preventRequestForgery(except: [
            'api/hikvision/*',
            'api/hikvision-callback',
            'api/hikvision-device-status',
            'api/telegram/webhook',
        ]);

        $middleware->alias([
            'abilities' => Laravel\Sanctum\Http\Middleware\CheckAbilities::class,
            'school.active' => App\Http\Middleware\CheckSchoolActive::class,
            'global.admin' => App\Http\Middleware\GlobalAdminMiddleware::class,
            'superadmin' => App\Http\Middleware\SuperadminMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A refused business rule: JSON for the mobile API, a flash error for the web panel
        $exceptions->render(function (App\Exceptions\ActionFailed $e, Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['success' => false, 'message' => $e->userMessage(), 'error' => $e->key], 422);
            }

            return back()->with('error', array_filter(['key' => $e->key, 'params' => $e->params]));
        });
    })->create();
