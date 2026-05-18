<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'initials',
        'contact',
        'phone',
        'email',
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
        'lease_end' => 'date',
        'rent' => 'integer',
        'deposit' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function unitRecord(): HasOne
    {
        return $this->hasOne(Unit::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function leases(): HasMany
    {
        return $this->hasMany(Lease::class);
    }

    public function activeLease(): HasOne
    {
        return $this->hasOne(Lease::class)
            ->where('status', 'active')
            ->latestOfMany();
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

    public function moveOutHistories(): HasMany
    {
        return $this->hasMany(MoveOutHistory::class);
    }

    // ── Computed Helpers ──────────────────────────────────────────────────────

    public function isExpiring(): bool
    {
        return $this->lease_end && now()->diffInDays($this->lease_end, false) <= 30
            && now()->diffInDays($this->lease_end, false) > 0;
    }

    public function isOverdue(): bool
    {
        return Invoice::where('tenant_id', $this->id)
            ->whereIn('status', ['due', 'pending'])
            ->where('due_date', '<', now())
            ->exists();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
