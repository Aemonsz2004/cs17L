<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'unit' => ['required', 'string', 'max:10'],
            'tenant' => ['required', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'type' => ['required', 'in:Electrical,Plumbing,Air Conditioning,Structural,General'],
            'priority' => ['nullable', 'in:high,medium,low'],
            'status' => ['nullable', 'in:open,inprogress,resolved'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
            'resolved_date' => ['nullable', 'date'],
            'notes' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit.required' => 'Unit / area is required.',
            'tenant.required' => 'Tenant name is required.',
            'title.required' => 'Issue title is required.',
            'notes.required' => 'Description is required.',
        ];
    }
}
