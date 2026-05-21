<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmMoveInRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'lease_duration' => ['required', 'integer', 'in:3,6,12'],
            'payment_method' => ['nullable', 'string', 'in:GCash,Cash'],
        ];
    }

    public function messages(): array
    {
        return [
            'lease_duration.required' => 'Lease duration is required.',
            'lease_duration.in' => 'Lease duration must be 3, 6, or 12 months.',
        ];
    }
}
