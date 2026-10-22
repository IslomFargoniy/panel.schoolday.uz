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

// Mobil ilova (Android) API — web paneldagi har bir amal shu yerda ham bor
Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::post('auth/login', [V1\AuthController::class, 'login'])->middleware('throttle:6,1')->name('auth.login');
    Route::post('auth/forgot-password', [V1\ProfileController::class, 'forgotPassword'])->middleware('throttle:3,1')->name('auth.forgot-password');

    Route::middleware(['auth:sanctum', 'abilities:school'])->group(function () {
        // Profile and security: allowed even when the school's subscription has ended
        Route::get('auth/me', [V1\AuthController::class, 'me'])->name('auth.me');
        Route::post('auth/logout', [V1\AuthController::class, 'logout'])->name('auth.logout');
        Route::post('auth/change-password', [V1\AuthController::class, 'changePassword'])->name('auth.change-password');
        Route::put('auth/profile', [V1\ProfileController::class, 'update'])->name('auth.profile.update');
        Route::delete('auth/profile', [V1\ProfileController::class, 'destroy'])->name('auth.profile.destroy');
        Route::middleware('throttle:10,1')->prefix('auth/two-factor')->name('auth.two-factor.')->group(function () {
            Route::post('enable', [V1\ProfileController::class, 'enableTwoFactor'])->name('enable');
            Route::post('confirm', [V1\ProfileController::class, 'confirmTwoFactor'])->name('confirm');
            Route::post('disable', [V1\ProfileController::class, 'disableTwoFactor'])->name('disable');
            Route::post('recovery-codes', [V1\ProfileController::class, 'recoveryCodes'])->name('recovery-codes');
            Route::post('recovery-codes/regenerate', [V1\ProfileController::class, 'regenerateRecoveryCodes'])->name('recovery-codes.regenerate');
        });

        Route::middleware('school.active')->group(function () {
            Route::get('filters', [V1\FilterController::class, 'index'])->name('filters');
            Route::get('dashboard', [V1\DashboardController::class, 'index'])->name('dashboard');
            Route::get('monitoring', [V1\MonitoringController::class, 'index'])->name('monitoring');

            Route::get('reports', [V1\ReportController::class, 'index'])->name('reports.index');
            Route::get('reports/export', [V1\ReportController::class, 'export'])->name('reports.export');
            Route::get('reports/{id}', [V1\ReportController::class, 'show'])->whereNumber('id')->name('reports.show');
            Route::delete('reports/{id}', [V1\ReportController::class, 'destroy'])->whereNumber('id')->name('reports.destroy');
            Route::delete('report-events/{id}', [V1\ReportController::class, 'destroyEvent'])->whereNumber('id')->name('report-events.destroy');

            Route::get('students/template', [V1\StudentController::class, 'template'])->name('students.template');
            Route::post('students/import', [V1\StudentController::class, 'import'])->name('students.import');
            Route::get('students', [V1\StudentController::class, 'index'])->name('students.index');
            Route::post('students', [V1\StudentController::class, 'store'])->name('students.store');
            Route::get('students/{student}', [V1\StudentController::class, 'show'])->name('students.show');
            // POST: the update carries a multipart photo
            Route::post('students/{student}', [V1\StudentController::class, 'update'])->name('students.update');
            Route::delete('students/{student}', [V1\StudentController::class, 'destroy'])->name('students.destroy');
            Route::get('students/{student}/events', [V1\StudentController::class, 'events'])->name('students.events');

            Route::get('classes', [V1\SchoolClassController::class, 'index'])->name('classes.index');
            Route::post('classes', [V1\SchoolClassController::class, 'store'])->name('classes.store');
            Route::get('classes/{schoolClass}', [V1\SchoolClassController::class, 'show'])->name('classes.show');
            Route::put('classes/{schoolClass}', [V1\SchoolClassController::class, 'update'])->name('classes.update');
            Route::delete('classes/{schoolClass}', [V1\SchoolClassController::class, 'destroy'])->name('classes.destroy');

            Route::apiResource('shifts', V1\ShiftController::class)->except('show');
            Route::apiResource('branches', V1\BranchController::class);
            Route::apiResource('devices', V1\DeviceController::class)->except('show');

            Route::get('schools', [V1\SchoolController::class, 'index'])->name('schools.index');
            Route::get('schools/{school}', [V1\SchoolController::class, 'show'])->name('schools.show');
        });

        // Admin / Superadmin
        Route::middleware('global.admin')->group(function () {
            Route::post('schools', [V1\SchoolController::class, 'store'])->name('schools.store');
            Route::put('schools/{school}', [V1\SchoolController::class, 'update'])->name('schools.update');
            Route::delete('schools/{school}', [V1\SchoolController::class, 'destroy'])->name('schools.destroy');
            Route::put('schools/{school}/settings', [V1\SchoolController::class, 'saveSettings'])->name('schools.settings');
            Route::post('schools/{school}/users', [V1\SchoolController::class, 'attachUser'])->name('schools.users.attach');
            Route::delete('schools/{school}/users/{user}', [V1\SchoolController::class, 'detachUser'])->name('schools.users.detach');
            Route::get('users/lookup', [V1\UserController::class, 'lookup'])->name('users.lookup');
        });

        // Superadmin
        Route::middleware('superadmin')->group(function () {
            Route::get('roles', [V1\UserController::class, 'roles'])->name('roles');
            Route::apiResource('users', V1\UserController::class)->except('show');
            Route::get('system-settings', [V1\SystemSettingController::class, 'show'])->name('system-settings.show');
            Route::put('system-settings', [V1\SystemSettingController::class, 'update'])->name('system-settings.update');
        });
    });
});
