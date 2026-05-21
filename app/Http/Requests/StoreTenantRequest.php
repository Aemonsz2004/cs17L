<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'initials' => ['required', 'string', 'max:4'],
            'contact' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', Rule::unique('tenants', 'phone')],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('tenants', 'email'),
                Rule::unique('users', 'email'),
            ],
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'lease_start' => ['required', 'date'],
            'lease_end' => ['nullable', 'date', 'after_or_equal:lease_start'],
            'occupation' => ['nullable', 'string', 'max:255'],
            'monthly_income' => ['nullable', 'numeric', 'min:0'],
            'emergency_contact' => ['nullable', 'string', 'max:255'],
            'lease_duration' => ['nullable', 'integer', 'in:3,6,12'],
            'status' => ['nullable', 'in:active,pending_payment'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.unique' => 'This phone number is already in use by another tenant.',
            'email.unique' => 'This email is already in use.',
            'unit_id.exists' => 'Selected unit does not exist.',
            'lease_end.after_or_equal' => 'Lease end must be on or after the lease start date.',
        ];
    }
}
