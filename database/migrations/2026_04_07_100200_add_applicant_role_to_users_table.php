<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'tenant', 'applicant') DEFAULT 'tenant'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE users SET role = 'tenant' WHERE role = 'applicant'");
            DB::statement("ALTER TABLE users MODIFY role ENUM('admin', 'tenant') DEFAULT 'tenant'");
        }
    }
};
