<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'initials',
        'contact',
        'phone',
        'email',
        'unit',
        'floor',
        'type',
        'rent',
        'deposit',
        'lease_start',
        'lease_end',
        'payment_method',
        'status',
    ];

    protected $casts = [
        'lease_start' => 'date',
        'lease_end'   => 'date',
        'rent'        => 'integer',
        'deposit'     => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function unitRecord(): HasOne
    {
        return $this->hasOne(Unit::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(RtmsNotification::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isExpiring(): bool { return $this->status === 'expiring'; }
    public function isOverdue(): bool  { return $this->status === 'overdue';  }
    public function isActive(): bool   { return $this->status === 'active';   }
}