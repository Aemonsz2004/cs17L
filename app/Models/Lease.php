<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lease extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'unit_id',
        'start_date',
        'end_date',
        'rent',
        'deposit',
        'payment_method',
        'status',
        'terms',
        'acknowledged_at',
        'ended_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'acknowledged_at' => 'datetime',
        'ended_at' => 'datetime',
        'rent' => 'integer',
        'deposit' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    // ── Computed Helpers ──────────────────────────────────────────────────────

    public function isExpiring(): bool
    {
        return $this->end_date && now()->diffInDays($this->end_date, false) <= 30
            && now()->diffInDays($this->end_date, false) > 0;
    }

    public function isOverdue(): bool
    {
        return $this->invoices()
            ->whereIn('status', ['due', 'pending'])
            ->where('due_date', '<', now())
            ->exists();
    }
}
