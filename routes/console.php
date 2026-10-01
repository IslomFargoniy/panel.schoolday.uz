<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('hikvision:sync-events')->everyMinute()->withoutOverlapping(10)->runInBackground();
Schedule::command('hikvision:healthcheck')->everyMinute()->runInBackground();
