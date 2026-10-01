<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

use App\Http\Controllers\BranchController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringController;

use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolClassController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\StudentController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('monitoring', [MonitoringController::class, 'index'])->name('monitoring');
    Route::get('monitoring/data', [MonitoringController::class, 'data'])->name('monitoring.data');
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('reports/{id}', [ReportController::class, 'show'])->name('reports.show');
    Route::delete('reports/{id}', [ReportController::class, 'destroy'])->name('reports.destroy');
    Route::delete('report-events/{id}', [ReportController::class, 'destroyEvent'])->name('report-events.destroy');

    Route::resource('users', App\Http\Controllers\UserController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->middleware(App\Http\Middleware\SuperadminMiddleware::class);
    Route::resource('school', App\Http\Controllers\SchoolController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::resource('user_school', App\Http\Controllers\UserSchoolController::class)
        ->only(['store', 'destroy']);
    Route::resource('school_setting', App\Http\Controllers\SchoolSettingController::class)
        ->only(['store']);
    Route::resource('branches', BranchController::class)
        ->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::resource('branch_device', App\Http\Controllers\BranchDeviceController::class)
        ->only(['store', 'update', 'destroy']);
    Route::get('devices', [App\Http\Controllers\BranchDeviceController::class, 'index'])->name('devices.index');
    Route::post('branch_device/{device}/sync', [App\Http\Controllers\Api\HikvisionController::class, 'syncDeviceEvents'])->name('branch_device.sync');
    Route::resource('shifts', ShiftController::class)->except(['create', 'show', 'edit']);
    Route::resource('classes', SchoolClassController::class)->except(['create', 'show', 'edit'])->parameters(['classes' => 'schoolClass']);
    Route::get('students/template', [StudentController::class, 'template'])->name('students.template');
    Route::post('students/import', [StudentController::class, 'import'])->name('students.import');
    Route::get('students/{student}/hikvision-events', [StudentController::class, 'hikvisionEvents'])->name('students.hikvision-events');
    Route::match(['put', 'patch', 'post'], 'students/{student}', [StudentController::class, 'update'])->name('students.update');
    Route::resource('students', StudentController::class)->except(['create', 'show', 'edit', 'update']);
});

require __DIR__ . '/settings.php';
