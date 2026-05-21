<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unit_id' => [
                'required',
                Rule::exists('units', 'id')->where(fn ($q) => $q
                    ->where('status', 'vacant')
                    ->whereNull('tenant_id')),
            ],
            'full_name' => ['required', 'string', 'max:255'],
            'occupation' => ['required', 'string', 'max:255'],
            'monthly_income' => ['required', 'integer', 'min:0'],
            'emergency_contact' => ['required', 'string', 'max:255'],
            'government_id' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'income_proof' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:4096'],
            'preferred_move_in' => ['nullable', 'date', 'after_or_equal:today'],
            'lease_duration' => ['nullable', 'integer', 'in:3,6,12'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit_id.required' => 'Please select a unit.',
            'unit_id.exists' => 'Selected unit is not available.',
            'full_name.required' => 'Full name is required.',
            'occupation.required' => 'Occupation is required.',
            'monthly_income.required' => 'Monthly income is required.',
            'emergency_contact.required' => 'Emergency contact is required.',
            'government_id.required' => 'Government ID is required.',
            'government_id.mimes' => 'Government ID must be a JPG, JPEG, PNG, or PDF.',
            'government_id.max' => 'Government ID must not exceed 4MB.',
            'income_proof.required' => 'Income proof is required.',
            'income_proof.mimes' => 'Income proof must be a JPG, JPEG, PNG, or PDF.',
            'income_proof.max' => 'Income proof must not exceed 4MB.',
        ];
    }
}
