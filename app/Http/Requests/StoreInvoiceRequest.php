<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_id' => ['required', 'exists:tenants,id'],
            'period' => ['required', 'string', 'max:50'],
            'rent' => ['required', 'integer', 'min:0'],
            'utilities' => ['nullable', 'integer', 'min:0'],
            'penalty' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['required', 'date'],
            'method' => ['nullable', 'in:GCash,Cash'],
            'status' => ['nullable', 'in:paid,due,overdue'],
        ];
    }

    public function messages(): array
    {
        return [
            'tenant_id.required' => 'Please select a tenant.',
            'tenant_id.exists' => 'Selected tenant does not exist.',
            'period.required' => 'Billing period is required.',
            'rent.required' => 'Rent amount is required.',
            'due_date.required' => 'Due date is required.',
        ];
    }
}
