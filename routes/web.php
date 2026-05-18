<?php

// routes/web.php

use App\Http\Controllers\Admin\ApplicationReviewController;
use App\Http\Controllers\Admin\BillingController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\MaintenanceController;
use App\Http\Controllers\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\TenantController;
use App\Http\Controllers\Admin\UnitController;
use App\Http\Controllers\Applicant\ApplicationController as ApplicantApplicationController;
use App\Http\Controllers\Applicant\RegisterController as ApplicantRegisterController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\GuestRegistrationController;
use App\Http\Controllers\Auth\TenantOtpController;
use App\Http\Controllers\Auth\TenantPasswordController;
use App\Http\Controllers\Site\LeasingController;
use App\Http\Controllers\Tenant\BillingController as TenantBillingController;
use App\Http\Controllers\Tenant\HomeController;
use App\Http\Controllers\Tenant\LeaseController;
use App\Http\Controllers\Tenant\MaintenanceController as TenantMaintenanceController;
use App\Http\Controllers\Tenant\MessageController;
use App\Http\Controllers\Tenant\NotificationController as TenantNotificationController;
use App\Http\Controllers\Tenant\PaymentController;
use App\Http\Controllers\Tenant\PayMongoDemoController;
use App\Http\Controllers\Webhook\PayMongoWebhookController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

// ── Root ──────────────────────────────────────────────────────────────────────

Route::get('/', [LeasingController::class, 'landing'])->name('landing');

Route::get('/units', [LeasingController::class, 'units'])->name('units.index');
Route::get('/units/{unit}', [LeasingController::class, 'show'])->name('units.show');

Route::post('/webhooks/paymongo', PayMongoWebhookController::class)
    ->withoutMiddleware([ValidateCsrfToken::class])
    ->name('webhooks.paymongo');

// ── Auth ──────────────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    Route::get('/apply/register', [ApplicantRegisterController::class, 'create'])->name('applicant.register');
    Route::post('/apply/register', [ApplicantRegisterController::class, 'store'])->name('applicant.register.store');
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
            Route::get('/', [TenantController::class, 'index'])->name('index');
            Route::post('/', [TenantController::class, 'store'])->name('store');
            Route::get('/{tenant}', [TenantController::class, 'show'])->name('show');
            Route::patch('/{tenant}', [TenantController::class, 'update'])->name('update');
            Route::post('/{tenant}/renew', [TenantController::class, 'renew'])->name('renew');
            Route::post('/{tenant}/move-out', [TenantController::class, 'moveOut'])->name('move-out');
            Route::delete('/{tenant}', [TenantController::class, 'destroy'])->name('destroy');
            Route::post('/{tenant}/restore', [TenantController::class, 'restore'])->name('restore');
        });

        // Units
        Route::prefix('units')->name('units.')->group(function () {
            Route::get('/', [UnitController::class, 'index'])->name('index');
            Route::post('/', [UnitController::class, 'store'])->name('store');
            Route::patch('/{unit}', [UnitController::class, 'update'])->name('update');
            Route::delete('/{unit}', [UnitController::class, 'destroy'])->name('destroy');
            Route::post('/{unit}/restore', [UnitController::class, 'restore'])->name('restore');
        });

        // Billing
        Route::prefix('billing')->name('billing.')->group(function () {
            Route::get('/', [BillingController::class, 'index'])->name('index');
            Route::post('/', [BillingController::class, 'store'])->name('store');
            Route::get('/{invoice}', [BillingController::class, 'show'])->name('show');
            Route::delete('/{invoice}', [BillingController::class, 'destroy'])->name('destroy');
            Route::post('/{invoice}/restore', [BillingController::class, 'restore'])->name('restore');
            Route::patch('/{invoice}/mark-paid', [BillingController::class, 'markPaid'])->name('mark-paid');
            Route::patch('/{invoice}/mark-overdue', [BillingController::class, 'markOverdue'])->name('mark-overdue');
            Route::patch('/{invoice}/confirm-bank', [BillingController::class, 'confirmBankTransfer'])->name('confirm-bank');
            Route::patch('/{invoice}/confirm-cash', [BillingController::class, 'confirmCashPayment'])->name('confirm-cash');
        });

        // Maintenance
        Route::prefix('maintenance')->name('maintenance.')->group(function () {
            Route::get('/', [MaintenanceController::class, 'index'])->name('index');
            Route::post('/', [MaintenanceController::class, 'store'])->name('store');
            Route::patch('/{maintenance}', [MaintenanceController::class, 'update'])->name('update');
            Route::delete('/{maintenance}', [MaintenanceController::class, 'destroy'])->name('destroy');
            Route::post('/{maintenance}/restore', [MaintenanceController::class, 'restore'])->name('restore');
        });

        // Notifications
        // {notification} resolves to RtmsNotification via bootstrap/app.php model binding
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [AdminNotificationController::class, 'index'])->name('index');
            Route::post('/read-all', [AdminNotificationController::class, 'markAllRead'])->name('read-all');
            Route::patch('/{notification}/read', [AdminNotificationController::class, 'markRead'])->name('read');
            Route::delete('/{notification}', [AdminNotificationController::class, 'destroy'])->name('destroy');
            Route::post('/{notification}/restore', [AdminNotificationController::class, 'restore'])->name('restore');
        });

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports');

        // Rental applications
        Route::prefix('applications')->name('applications.')->group(function () {
            Route::get('/', [ApplicationReviewController::class, 'index'])->name('index');
            Route::post('/{application}/approve', [ApplicationReviewController::class, 'approve'])->name('approve');
            Route::patch('/{application}/reject', [ApplicationReviewController::class, 'reject'])->name('reject');
            Route::patch('/{application}/send-lease', [ApplicationReviewController::class, 'sendLease'])->name('send-lease');
            Route::patch('/{application}/confirm-deposit', [ApplicationReviewController::class, 'confirmDeposit'])->name('confirm-deposit');
            Route::post('/{application}/convert-tenant', [ApplicationReviewController::class, 'convertToTenant'])->name('convert-tenant');
            Route::delete('/{application}', [ApplicationReviewController::class, 'destroy'])->name('destroy');
            Route::post('/{application}/restore', [ApplicationReviewController::class, 'restore'])->name('restore');
        });

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

        Route::get('/home', [HomeController::class,  'index'])->name('home');
        Route::get('/lease', [LeaseController::class, 'index'])->name('lease');

        // Billing
        Route::get('/billing', [TenantBillingController::class, 'index'])->name('billing');
        Route::delete('/billing/{invoice}', [TenantBillingController::class, 'destroy'])->name('billing.destroy');
        Route::post('/billing/{invoice}/restore', [TenantBillingController::class, 'restore'])->name('billing.restore');

        // Pay rent
        Route::get('/pay-rent', [PaymentController::class, 'index'])->name('pay-rent');
        Route::post('/pay-rent', [PaymentController::class, 'submit'])->name('pay-rent.submit');

        // Demo PayMongo-style APIs for frontend payment simulation
        Route::prefix('paymongo/demo')->name('paymongo.demo.')->group(function () {
            Route::post('/payment-intents', [PayMongoDemoController::class, 'createIntent'])->name('intents.create');
            Route::get('/payment-intents/{intentId}', [PayMongoDemoController::class, 'showIntent'])->name('intents.show');
            Route::post('/payment-intents/{intentId}/confirm', [PayMongoDemoController::class, 'confirmIntent'])->name('intents.confirm');
        });

        // Maintenance
        Route::get('/maintenance', [TenantMaintenanceController::class, 'index'])->name('maintenance');
        Route::post('/maintenance', [TenantMaintenanceController::class, 'store'])->name('maintenance.store');
        Route::delete('/maintenance/{maintenance}', [TenantMaintenanceController::class, 'destroy'])->name('maintenance.destroy');
        Route::post('/maintenance/{maintenance}/restore', [TenantMaintenanceController::class, 'restore'])->name('maintenance.restore');

        // Messages
        Route::get('/messages', [MessageController::class, 'index'])->name('messages');
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');

        // Notifications
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [TenantNotificationController::class, 'index'])->name('index');
            Route::post('/read-all', [TenantNotificationController::class, 'markAllRead'])->name('read-all');
            Route::patch('/{notification}/read', [TenantNotificationController::class, 'markRead'])->name('read');
            Route::delete('/{notification}', [TenantNotificationController::class, 'destroy'])->name('destroy');
            Route::post('/{notification}/restore', [TenantNotificationController::class, 'restore'])->name('restore');
        });
    });

Route::middleware(['auth', 'applicant'])
    ->prefix('apply')
    ->name('applicant.')
    ->group(function () {
        Route::get('/dashboard', [ApplicantApplicationController::class, 'dashboard'])->name('dashboard');
        Route::get('/form', [ApplicantApplicationController::class, 'create'])->name('form');
        Route::post('/form', [ApplicantApplicationController::class, 'store'])->name('form.store');
        Route::post('/{application}/acknowledge-lease', [ApplicantApplicationController::class, 'acknowledgeLease'])->name('acknowledge-lease');
        Route::post('/{application}/submit-deposit', [ApplicantApplicationController::class, 'submitDeposit'])->name('submit-deposit');
    });

// NEW ADDED ROUTES
Route::middleware('guest')->group(function () {
    Route::get('/register', [GuestRegistrationController::class, 'create'])->name('register');
    Route::post('/register', [GuestRegistrationController::class, 'store']);
});

Route::post('/register/payment/confirm', [GuestRegistrationController::class, 'confirmPayment'])->name('register.payment.confirm');
