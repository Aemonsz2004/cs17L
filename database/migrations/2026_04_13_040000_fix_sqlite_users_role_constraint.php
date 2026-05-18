<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        $this->rebuildUsersTable(['admin', 'tenant', 'applicant']);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        DB::table('users')
            ->where('role', 'applicant')
            ->update(['role' => 'tenant']);

        $this->rebuildUsersTable(['admin', 'tenant']);
    }

    private function rebuildUsersTable(array $roles): void
    {
        $tempTable = 'users_role_fix_tmp';

        $hasMustChange = Schema::hasColumn('users', 'must_change_password');
        $hasOtpCode = Schema::hasColumn('users', 'otp_code');
        $hasOtpExpiresAt = Schema::hasColumn('users', 'otp_expires_at');

        $allowedRoles = "'".implode("','", $roles)."'";

        DB::statement('PRAGMA foreign_keys=OFF');

        try {
            if (Schema::hasTable($tempTable)) {
                Schema::drop($tempTable);
            }

            Schema::create($tempTable, function (Blueprint $table) use ($roles, $hasMustChange, $hasOtpCode, $hasOtpExpiresAt): void {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->enum('role', $roles)->default('tenant');
                $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();

                if ($hasMustChange) {
                    $table->boolean('must_change_password')->default(false);
                }

                if ($hasOtpCode) {
                    $table->string('otp_code')->nullable();
                }

                if ($hasOtpExpiresAt) {
                    $table->timestamp('otp_expires_at')->nullable();
                }

                $table->rememberToken();
                $table->timestamps();
            });

            $insertColumns = [
                'id',
                'name',
                'email',
                'email_verified_at',
                'password',
                'role',
                'tenant_id',
            ];

            if ($hasMustChange) {
                $insertColumns[] = 'must_change_password';
            }

            if ($hasOtpCode) {
                $insertColumns[] = 'otp_code';
            }

            if ($hasOtpExpiresAt) {
                $insertColumns[] = 'otp_expires_at';
            }

            $insertColumns[] = 'remember_token';
            $insertColumns[] = 'created_at';
            $insertColumns[] = 'updated_at';

            $selectColumns = [
                'id',
                'name',
                'email',
                'email_verified_at',
                'password',
                DB::raw("CASE WHEN role IN ($allowedRoles) THEN role ELSE 'tenant' END as role"),
                'tenant_id',
            ];

            if ($hasMustChange) {
                $selectColumns[] = 'must_change_password';
            }

            if ($hasOtpCode) {
                $selectColumns[] = 'otp_code';
            }

            if ($hasOtpExpiresAt) {
                $selectColumns[] = 'otp_expires_at';
            }

            $selectColumns[] = 'remember_token';
            $selectColumns[] = 'created_at';
            $selectColumns[] = 'updated_at';

            DB::table($tempTable)->insertUsing(
                $insertColumns,
                DB::table('users')->select($selectColumns)
            );

            Schema::drop('users');
            Schema::rename($tempTable, 'users');
        } finally {
            DB::statement('PRAGMA foreign_keys=ON');
        }
    }
};
