<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Hikvision Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for interacting with the local C++ ISUP 5.0 gateway daemon
    | and public device connection parameters.
    |
    */

    'gateway_url' => env('HIKVISION_GATEWAY_URL', 'http://127.0.0.1:7671'),

    'gateway_secret' => env('HIKVISION_GATEWAY_SECRET'),

    // Trust requests coming from 127.0.0.1/::1 without X-Gateway-Secret.
    // Set to false when a reverse proxy sits in front of the app (all clients then look like localhost).
    'trust_localhost' => (bool) env('HIKVISION_TRUST_LOCALHOST', true),

    'default_encryption_key' => env('HIKVISION_DEFAULT_KEY', null),

    'das_address' => env('HIKVISION_DAS_ADDRESS', '193.180.213.188'),

    'cms_port' => (int) env('HIKVISION_CMS_PORT', 7670),

    'alarm_port' => (int) env('HIKVISION_ALARM_PORT', 7270),

    'timeout' => (int) env('HIKVISION_TIMEOUT', 10),

    // Hodisa vaqti shuncha daqiqadan eski bo'lsa (internet uzilib kechikib yetib kelgan), ota-onalarga Telegram xabari yuborilmaydi.
    // Davomat baribir yangilanadi. 0 — o'chirish (doim yuboriladi).
    'notify_max_delay_minutes' => (int) env('HIKVISION_NOTIFY_MAX_DELAY_MINUTES', 10),

    // ISUP qurilma shuncha daqiqadan ko'p aloqasiz bo'lib qayta ulansa, offline davri qurilmadan qayta sinxronlanadi. 0 — o'chirish.
    'catchup_gap_minutes' => (int) env('HIKVISION_CATCHUP_GAP_MINUTES', 30),

    // Catch-up sinxronlash eng ko'pi bilan shuncha kun orqaga qaraydi.
    'catchup_max_age_days' => (int) env('HIKVISION_CATCHUP_MAX_AGE_DAYS', 45),

    /*
    |--------------------------------------------------------------------------
    | Self-healing restart command
    |--------------------------------------------------------------------------
    | Shell command to restart the ISUP daemon when consecutive health-check
    | failures exceed the threshold. Set to null to disable self-healing.
    | Example: "systemctl restart hikvision-isup-schoolday"
    */
    'restart_command' => env('HIKVISION_RESTART_COMMAND', null),
];
