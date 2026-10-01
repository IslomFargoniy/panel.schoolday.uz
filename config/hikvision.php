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

    'default_encryption_key' => env('HIKVISION_DEFAULT_KEY', null),

    'das_address' => env('HIKVISION_DAS_ADDRESS', '193.180.213.188'),

    'cms_port' => (int) env('HIKVISION_CMS_PORT', 7670),

    'alarm_port' => (int) env('HIKVISION_ALARM_PORT', 7270),

    'timeout' => (int) env('HIKVISION_TIMEOUT', 10),

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
