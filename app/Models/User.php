<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'tenant_id',
        'must_change_password',
        'otp_code',
        'otp_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'must_change_password' => 'boolean',
        'otp_expires_at' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function rentalApplications(): HasMany
    {
        return $this->hasMany(RentalApplication::class);
    }

    public function applicationPayments(): HasMany
    {
        return $this->hasMany(ApplicationPayment::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTenant(): bool
    {
        return $this->tenant_id !== null;
    }

    public function isApplicant(): bool
    {
        return $this->role === 'applicant' && $this->tenant_id === null;
    }
}
