<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('unit_id')->constrained('units')->restrictOnDelete();
            $table->string('full_name');
            $table->string('occupation');
            $table->unsignedInteger('monthly_income');
            $table->string('emergency_contact');
            $table->string('government_id_path');
            $table->string('income_proof_path');
            $table->enum('status', [
                'pending_review',
                'approved',
                'rejected',
                'lease_sent',
                'lease_acknowledged',
                'deposit_submitted',
                'deposit_confirmed',
                'converted',
            ])->default('pending_review');
            $table->text('rejection_reason')->nullable();
            $table->longText('lease_terms')->nullable();
            $table->timestamp('lease_acknowledged_at')->nullable();
            $table->enum('deposit_method', ['GCash', 'Bank Transfer', 'Maya'])->nullable();
            $table->string('deposit_reference')->nullable();
            $table->timestamp('deposit_submitted_at')->nullable();
            $table->timestamp('deposit_confirmed_at')->nullable();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_applications');
    }
};
