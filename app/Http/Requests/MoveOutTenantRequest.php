<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoveOutTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'damages' => ['nullable', 'string', 'max:1000'],
            'balance_due' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Move-out reason is required.',
        ];
    }
}
