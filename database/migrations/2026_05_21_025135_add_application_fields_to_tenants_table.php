<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('occupation')->nullable()->after('email');
            $table->decimal('monthly_income', 12, 2)->nullable()->after('occupation');
            $table->string('emergency_contact')->nullable()->after('monthly_income');
            $table->integer('lease_duration')->nullable()->after('lease_end');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['occupation', 'monthly_income', 'emergency_contact', 'lease_duration']);
        });
    }
};
