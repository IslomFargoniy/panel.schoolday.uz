<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('hikvision:sync-events')->everyMinute()->withoutOverlapping(10)->runInBackground();
Schedule::command('hikvision:healthcheck')->everyMinute()->runInBackground();
// Kichik bo'shliqlar uchun himoya: har kecha oxirgi 3 kunni qayta sinxronlash (dublikatlar o'tkazib yuboriladi)
Schedule::command('hikvision:sync-events --days=3')->dailyAt('03:30')->withoutOverlapping(30)->runInBackground();
