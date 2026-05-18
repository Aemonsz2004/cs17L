<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\ApplicantMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\TenantMiddleware;
use App\Models\RtmsNotification;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Explicit route model binding:
            // {notification} in routes/web.php resolves to RtmsNotification
            Route::model(
                'notification',
                RtmsNotification::class,
            );
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Inertia middleware runs on every web request
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        // External payment providers (PayMongo) cannot send CSRF tokens.
        $middleware->validateCsrfTokens(except: [
            'webhooks/paymongo',
        ]);

        // Named middleware aliases used in routes/web.php
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'tenant' => TenantMiddleware::class,
            'applicant' => ApplicantMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
