<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationPayment extends Model
{
    protected $fillable = [
        'rental_application_id',
        'user_id',
        'provider',
        'provider_reference',
        'checkout_url',
        'amount',
        'currency',
        'payment_method',
        'status',
        'metadata',
        'webhook_payload',
        'paid_at',
        'verified_at',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'metadata' => 'array',
        'webhook_payload' => 'array',
        'paid_at' => 'datetime',
        'verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(RentalApplication::class, 'rental_application_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isVerified(): bool
    {
        return $this->status === 'payment_paid';
    }
}
