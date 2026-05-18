<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add deposit_amount to units
        Schema::table('units', function (Blueprint $table) {
            $table->unsignedInteger('deposit_amount')->nullable()->after('base_rent')
                ->comment('Custom security deposit amount; if null, use 2x base_rent');
        });

        // Add cash payment fields to invoices
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('receipt_number')->nullable()->after('reference')
                ->comment('Official receipt number for cash payments');
            $table->foreignId('recorded_by_admin_id')->nullable()->after('receipt_number')
                ->constrained('users')->nullOnDelete()
                ->comment('Admin who recorded/confirmed the cash payment');
            $table->timestamp('payment_received_at')->nullable()->after('recorded_by_admin_id')
                ->comment('When the cash payment was received (timestamp)');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropColumn('deposit_amount');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['recorded_by_admin_id']);
            $table->dropColumn(['receipt_number', 'recorded_by_admin_id', 'payment_received_at']);
        });
    }
};
