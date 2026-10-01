<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
    }

    protected function registerPolicies(): void
    {
        \Illuminate\Support\Facades\Gate::policy(\App\Models\School::class, \App\Policies\SchoolPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Branch::class, \App\Policies\BranchPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Shift::class, \App\Policies\ShiftPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\SchoolClass::class, \App\Policies\SchoolClassPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Student::class, \App\Policies\StudentPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\BranchDevice::class, \App\Policies\BranchDevicePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\DailyAttendance::class, \App\Policies\DailyAttendancePolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\HikvisionAccessEvent::class, \App\Policies\HikvisionAccessEventPolicy::class);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        $dateSerializer = function ($carbon) {
            return $carbon->format($carbon->format('H:i:s') === '00:00:00' ? 'Y-m-d' : 'Y-m-d H:i:s');
        };
        \Carbon\Carbon::serializeUsing($dateSerializer);
        CarbonImmutable::serializeUsing($dateSerializer);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
