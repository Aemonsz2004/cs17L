<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('rental_application_id')->constrained('rental_applications')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('provider', 40)->default('paymongo');
            $table->string('provider_reference')->unique();
            $table->text('checkout_url')->nullable();
            $table->unsignedInteger('amount');
            $table->string('currency', 8)->default('PHP');
            $table->string('payment_method', 40)->nullable();
            $table->enum('status', ['pending', 'payment_verified', 'failed', 'expired'])->default('pending');
            $table->json('metadata')->nullable();
            $table->json('webhook_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['rental_application_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_payments');
    }
};
