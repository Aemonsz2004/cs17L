<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'number',
        'floor',
        'type',
        'area',
        'base_rent',
        'deposit_amount',
        'status',
        'tenant_id',
        'reserved_until',
        'description',
        'gallery',
    ];

    protected $casts = [
        'area' => 'integer',
        'base_rent' => 'integer',
        'deposit_amount' => 'integer',
        'reserved_until' => 'datetime',
        'gallery' => 'array',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function setNumberAttribute(string $value): void
    {
        $this->attributes['number'] = strtoupper(trim($value));
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function leases(): HasMany
    {
        return $this->hasMany(Lease::class);
    }

    public function rentalApplications(): HasMany
    {
        return $this->hasMany(RentalApplication::class);
    }

    public function unitHistories(): HasMany
    {
        return $this->hasMany(UnitHistory::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePubliclyVisible($query)
    {
        return $query->where('status', 'vacant');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isVacant(): bool
    {
        return $this->status === 'vacant';
    }

    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }

    public function getDepositAmount(): int
    {
        return $this->deposit_amount ?? ($this->base_rent * 2);
    }
}
