<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenewLeaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lease_start' => ['required', 'date'],
            'lease_end' => ['required', 'date', 'after_or_equal:lease_start'],
            'rent' => ['required', 'integer', 'min:0'],
            'deposit' => ['required', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'in:GCash,Cash'],
            'terms' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'lease_start.required' => 'Lease start date is required.',
            'lease_end.required' => 'Lease end date is required.',
            'lease_end.after_or_equal' => 'Lease end must be on or after the start date.',
            'rent.required' => 'Monthly rent is required.',
            'deposit.required' => 'Security deposit is required.',
        ];
    }
}
