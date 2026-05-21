<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('number')) {
            $this->merge([
                'number' => strtoupper(trim((string) $this->input('number'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'number' => ['required', 'string', 'max:10', Rule::unique('units', 'number')],
            'floor' => ['required', 'in:GF,1F,2F,3F'],
            'type' => ['required', 'in:Office,Retail,Medical'],
            'area' => ['required', 'integer', 'min:1'],
            'base_rent' => ['required', 'integer', 'min:0'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'gallery' => ['nullable', 'array'],
            'gallery.*' => ['file', 'image', 'max:5120'],
            'status' => ['required', Rule::in(['vacant', 'occupied', 'maintenance', 'pending', 'reserved'])],
        ];
    }

    public function messages(): array
    {
        return [
            'number.unique' => 'This unit number already exists.',
            'area.min' => 'Area must be greater than 0.',
            'base_rent.min' => 'Base rent cannot be negative.',
        ];
    }
}
