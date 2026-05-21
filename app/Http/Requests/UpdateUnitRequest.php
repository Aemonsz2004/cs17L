<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
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
        $unitId = $this->route('unit')?->id ?? $this->route('unit');

        return [
            'number' => ['sometimes', 'string', 'max:10', Rule::unique('units', 'number')->ignore($unitId)],
            'floor' => ['sometimes', 'in:GF,1F,2F,3F'],
            'type' => ['sometimes', 'in:Office,Retail,Medical'],
            'area' => ['sometimes', 'integer', 'min:1'],
            'base_rent' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['vacant', 'occupied', 'maintenance', 'pending', 'reserved'])],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'gallery' => ['sometimes', 'nullable', 'array'],
            'gallery.*' => ['file', 'image', 'max:5120'],
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
