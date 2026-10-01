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

    'das_address' => env('HIKVISION_DAS_ADDRESS', '193.180.213.188'),

    'cms_port' => (int) env('HIKVISION_CMS_PORT', 7670),

    'alarm_port' => (int) env('HIKVISION_ALARM_PORT', 7270),

    'timeout' => (int) env('HIKVISION_TIMEOUT', 10),
];
