<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_no',
        'tenant_id',
        'lease_id',
        'period',
        'rent',
        'utilities',
        'penalty',
        'total',
        'due_date',
        'paid_date',
        'method',
        'status',
        'reference',
        'confirmed_at',
    ];

    protected $casts = [
        'due_date'  => 'date',
        'paid_date' => 'date',
        'confirmed_at' => 'datetime',
        'rent'      => 'integer',
        'utilities' => 'integer',
        'penalty'   => 'integer',
        'total'     => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopePendingBankTransfer($query)
    {
        return $query->where('method', 'Bank Transfer')
            ->where('status', 'due')
            ->whereNull('confirmed_at');
    }

    public function scopeAwaitingConfirmation($query)
    {
        return $query->where('method', 'Bank Transfer')
            ->where('status', 'due')
            ->whereNotNull('reference')
            ->whereNull('confirmed_at');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Generate the next sequential invoice number.
     * e.g. INV-001 → INV-002 → INV-042
     */
    public static function nextInvoiceNo(): string
    {
        $last = static::latest('id')->value('invoice_no');

        if (! $last) {
            return 'INV-001';
        }

        $num = (int) substr($last, 4) + 1;

        return 'INV-' . str_pad($num, 3, '0', STR_PAD_LEFT);
    }
}