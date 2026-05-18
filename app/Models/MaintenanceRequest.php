<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'unit',
        'tenant',
        'tenant_id',
        'type',
        'priority',
        'status',
        'assigned_to',
        'resolved_date',
        'notes',
    ];

    protected $casts = [
        'resolved_date' => 'date',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function tenantRecord(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'inprogress';
    }

    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }
}
