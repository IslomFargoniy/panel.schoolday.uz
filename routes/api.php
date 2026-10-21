<?php

use App\Http\Controllers\Api\HikvisionController;
use App\Http\Controllers\Api\TelegramController;
use App\Http\Controllers\Api\V1;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::any('/hikvision/events', [HikvisionController::class, 'store']);
Route::any('/hikvision-callback', [HikvisionController::class, 'store']);
Route::get('/hikvision-device-key', [HikvisionController::class, 'getDeviceKey']);
Route::post('/hikvision-device-status', [HikvisionController::class, 'updateDeviceStatus']);
Route::post('/telegram/webhook', [TelegramController::class, 'handle']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Mobil ilova (Android) API
Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('auth/login', [V1\AuthController::class, 'login'])->middleware('throttle:6,1')->name('auth.login');

    Route::middleware(['auth:sanctum', 'abilities:school'])->group(function () {
        Route::get('auth/me', [V1\AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [V1\AuthController::class, 'logout'])->name('auth.logout');
        Route::post('auth/change-password', [V1\AuthController::class, 'changePassword'])->name('auth.change-password');

        Route::middleware('school.active')->group(function () {
            Route::get('filters', [V1\FilterController::class, 'index'])->name('filters');
            Route::get('dashboard', [V1\DashboardController::class, 'index'])->name('dashboard');
            Route::get('monitoring', [V1\MonitoringController::class, 'index'])->name('monitoring');
            Route::get('classes', [V1\SchoolClassController::class, 'index'])->name('classes.index');
            Route::get('classes/{schoolClass}', [V1\SchoolClassController::class, 'show'])->name('classes.show');
            Route::get('students', [V1\StudentController::class, 'index'])->name('students.index');
            Route::get('students/{student}', [V1\StudentController::class, 'show'])->name('students.show');
            Route::get('students/{student}/events', [V1\StudentController::class, 'events'])->name('students.events');
            Route::get('reports', [V1\ReportController::class, 'index'])->name('reports.index');
            Route::get('reports/export', [V1\ReportController::class, 'export'])->name('reports.export');
            Route::get('reports/{id}', [V1\ReportController::class, 'show'])->whereNumber('id')->name('reports.show');
            Route::get('devices', [V1\DeviceController::class, 'index'])->name('devices.index');
        });
    });
});
