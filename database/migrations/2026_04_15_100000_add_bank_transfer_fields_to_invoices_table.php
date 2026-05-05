<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('reference')->nullable()->comment('Payment reference (required for Bank Transfer)');
            $table->timestamp('confirmed_at')->nullable()->comment('When admin confirmed the bank payment');
            $table->index(['method', 'confirmed_at']);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex(['method', 'confirmed_at']);
            $table->dropColumn(['reference', 'confirmed_at']);
        });
    }
};
