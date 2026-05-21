<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'unit' => ['sometimes', 'string', 'max:10'],
            'tenant' => ['sometimes', 'string', 'max:255'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'type' => ['sometimes', 'in:Electrical,Plumbing,Air Conditioning,Structural,General'],
            'priority' => ['sometimes', 'in:high,medium,low'],
            'status' => ['sometimes', 'in:open,inprogress,resolved'],
            'assigned_to' => ['nullable', 'string', 'max:255'],
            'resolved_date' => ['nullable', 'date'],
            'notes' => ['sometimes', 'string'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (
                $this->input('status') === 'resolved'
                && empty($this->input('resolved_date'))
            ) {
                $validator->errors()->add(
                    'resolved_date',
                    'Resolved date is required when marking a request as resolved.',
                );
            }
        });
    }
}
