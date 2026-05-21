<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id ?? $this->route('tenant');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'initials' => ['sometimes', 'string', 'max:4'],
            'contact' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20', Rule::unique('tenants', 'phone')->ignore($tenantId)],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('tenants', 'email')->ignore($tenantId)],
            'unit_id' => ['sometimes', 'integer', 'exists:units,id'],
            'lease_start' => ['sometimes', 'date'],
            'lease_end' => ['sometimes', 'date'],
            'payment_method' => ['sometimes', 'in:GCash,Cash'],
            'status' => ['sometimes', 'in:active,pending_payment,moved_out,terminated'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'This phone number is already in use by another tenant.',
            'email.unique' => 'This email is already in use.',
        ];
    }
}
