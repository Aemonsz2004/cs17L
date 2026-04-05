<?php

// routes/web.php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\TenantOtpController;
use App\Http\Controllers\Auth\TenantPasswordController;

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\UnitController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\NotificationController      as AdminNotificationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\MessageController           as AdminMessageController;

use App\Http\Controllers\Tenant\HomeController;
use App\Http\Controllers\Tenant\LeaseController;
use App\Http\Controllers\Tenant\BillingController         as TenantBillingController;
use App\Http\Controllers\Tenant\PayMongoDemoController;
use App\Http\Controllers\Tenant\PaymentController;
use App\Http\Controllers\Tenant\MaintenanceController     as TenantMaintenanceController;
use App\Http\Controllers\Tenant\MessageController;
use App\Http\Controllers\Tenant\NotificationController    as TenantNotificationController;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// ── Root ──────────────────────────────────────────────────────────────────────

Route::get('/', function () {
    if (Auth::check()) {
        $user = Auth::user();

        if (! $user instanceof \App\Models\User) {
            return redirect()->route('login');
        }

        return $user->isAdmin()
            ? redirect()->route('admin.dashboard')
            : redirect()->route('tenant.home');
    }
    return redirect()->route('login');
});

// ── Auth ──────────────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function () {
    Route::get('/login',  [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

Route::middleware(['auth', 'tenant'])
    ->prefix('tenant')
    ->name('tenant.')
    ->group(function () {
        Route::get('/set-password', [TenantPasswordController::class, 'create'])->name('password.create');
        Route::post('/set-password', [TenantPasswordController::class, 'store'])->name('password.store');

        Route::get('/otp', [TenantOtpController::class, 'create'])->name('otp.show');
        Route::post('/otp/verify', [TenantOtpController::class, 'store'])->name('otp.verify');
        Route::post('/otp/resend', [TenantOtpController::class, 'resend'])->name('otp.resend');
    });

// ── Admin ─────────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // Tenants
        Route::prefix('tenants')->name('tenants.')->group(function () {
            Route::get('/',            [TenantController::class, 'index'])  ->name('index');
            Route::post('/',           [TenantController::class, 'store'])  ->name('store');
            Route::get('/{tenant}',    [TenantController::class, 'show'])   ->name('show');
            Route::patch('/{tenant}',  [TenantController::class, 'update']) ->name('update');
            Route::delete('/{tenant}', [TenantController::class, 'destroy'])->name('destroy');
        });

        // Units
        Route::prefix('units')->name('units.')->group(function () {
            Route::get('/',           [UnitController::class, 'index'])  ->name('index');
            Route::post('/',          [UnitController::class, 'store'])  ->name('store');
            Route::patch('/{unit}',   [UnitController::class, 'update']) ->name('update');
            Route::delete('/{unit}',  [UnitController::class, 'destroy'])->name('destroy');
        });

        // Billing
        Route::prefix('billing')->name('billing.')->group(function () {
            Route::get('/',                         [BillingController::class, 'index'])      ->name('index');
            Route::post('/',                        [BillingController::class, 'store'])      ->name('store');
            Route::get('/{invoice}',                [BillingController::class, 'show'])       ->name('show');
            Route::patch('/{invoice}/mark-paid',    [BillingController::class, 'markPaid'])   ->name('mark-paid');
            Route::patch('/{invoice}/mark-overdue', [BillingController::class, 'markOverdue'])->name('mark-overdue');
        });

        // Maintenance
        Route::prefix('maintenance')->name('maintenance.')->group(function () {
            Route::get('/',                [MaintenanceController::class, 'index'])  ->name('index');
            Route::post('/',               [MaintenanceController::class, 'store'])  ->name('store');
            Route::patch('/{maintenance}', [MaintenanceController::class, 'update']) ->name('update');
            Route::delete('/{maintenance}',[MaintenanceController::class, 'destroy'])->name('destroy');
        });

        // Notifications
        // {notification} resolves to RtmsNotification via bootstrap/app.php model binding
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/',                        [AdminNotificationController::class, 'index'])      ->name('index');
            Route::post('/read-all',               [AdminNotificationController::class, 'markAllRead'])->name('read-all');
            Route::patch('/{notification}/read',   [AdminNotificationController::class, 'markRead'])  ->name('read');
        });

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports');

        // Tenant messages
        Route::prefix('messages')->name('messages.')->group(function () {
            Route::get('/', [AdminMessageController::class, 'index'])->name('index');
            Route::post('/reply', [AdminMessageController::class, 'reply'])->name('reply');
            Route::patch('/{message}/read', [AdminMessageController::class, 'markRead'])->name('read');
        });
    });

// ── Tenant ────────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'tenant'])
    ->prefix('tenant')
    ->name('tenant.')
    ->group(function () {

        Route::get('/home',  [HomeController::class,  'index'])->name('home');
        Route::get('/lease', [LeaseController::class, 'index'])->name('lease');

        // Billing
        Route::get('/billing', [TenantBillingController::class, 'index'])->name('billing');

        // Pay rent
        Route::get('/pay-rent',  [PaymentController::class, 'index']) ->name('pay-rent');
        Route::post('/pay-rent', [PaymentController::class, 'submit'])->name('pay-rent.submit');

        // Demo PayMongo-style APIs for frontend payment simulation
        Route::prefix('paymongo/demo')->name('paymongo.demo.')->group(function () {
            Route::post('/payment-intents', [PayMongoDemoController::class, 'createIntent'])->name('intents.create');
            Route::get('/payment-intents/{intentId}', [PayMongoDemoController::class, 'showIntent'])->name('intents.show');
            Route::post('/payment-intents/{intentId}/confirm', [PayMongoDemoController::class, 'confirmIntent'])->name('intents.confirm');
        });

        // Maintenance
        Route::get('/maintenance',  [TenantMaintenanceController::class, 'index'])->name('maintenance');
        Route::post('/maintenance', [TenantMaintenanceController::class, 'store'])->name('maintenance.store');

        // Messages
        Route::get('/messages',  [MessageController::class, 'index'])->name('messages');
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');

        // Notifications
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/',          [TenantNotificationController::class, 'index'])      ->name('index');
            Route::post('/read-all', [TenantNotificationController::class, 'markAllRead'])->name('read-all');
            Route::patch('/{notification}/read', [TenantNotificationController::class, 'markRead'])->name('read');
        });
    });