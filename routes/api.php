<?php

use App\Http\Controllers\Api\HikvisionController;
use App\Http\Controllers\Api\TelegramController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::any('/hikvision/events', [HikvisionController::class, 'store']);
Route::any('/hikvision-callback', [HikvisionController::class, 'store']);
Route::get('/hikvision-device-key', [HikvisionController::class, 'getDeviceKey']);
Route::post('/hikvision-device-status', [HikvisionController::class, 'updateDeviceStatus']);
Route::post('/telegram/webhook', [TelegramController::class, 'handle']);

// NOTE: The external sync-tool API (/api/sync/students) has been removed.
// The sync functionality is now handled via the built-in ISUP cloud integration.
// SyncApiController and SYNC_API_TOKEN are kept for reference but are no longer used.

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
