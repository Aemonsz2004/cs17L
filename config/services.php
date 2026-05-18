<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paymongo' => [
        'enabled' => (bool) env('PAYMONGO_ENABLED', false),
        'secret_key' => env('PAYMONGO_SECRET_KEY'),
        'public_key' => env('PAYMONGO_PUBLIC_KEY'),
        'webhook_secret' => env('PAYMONGO_WEBHOOK_SECRET'),
        'verify_tls' => (bool) env('PAYMONGO_VERIFY_TLS', true),
        'ca_bundle_path' => env('PAYMONGO_CA_BUNDLE_PATH'),
        'allow_insecure_local_fallback' => (bool) env('PAYMONGO_ALLOW_INSECURE_LOCAL_FALLBACK', false),
        'base_url' => env('PAYMONGO_BASE_URL', 'https://api.paymongo.com/v1'),
        'success_url' => env('PAYMONGO_SUCCESS_URL', env('APP_URL').'/apply/dashboard'),
        'cancel_url' => env('PAYMONGO_CANCEL_URL', env('APP_URL').'/apply/dashboard'),
        'timeout_seconds' => (int) env('PAYMONGO_TIMEOUT_SECONDS', 20),
        'checkout_base_url' => env('PAYMONGO_CHECKOUT_BASE_URL', 'https://payments.paymongo.com/checkout/{reference}'),
        'deposit_expires_minutes' => (int) env('PAYMONGO_DEPOSIT_EXPIRES_MINUTES', 30),
    ],

    'applications' => [
        'reservation_hours' => (int) env('APPLICATION_RESERVATION_HOURS', 48),
        'lease_response_hours' => (int) env('APPLICATION_LEASE_RESPONSE_HOURS', 72),
        'deposit_window_hours' => (int) env('APPLICATION_DEPOSIT_WINDOW_HOURS', 24),
    ],

];
