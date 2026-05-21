<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApproveApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'unit_id' => ['required', 'exists:units,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'unit_id.required' => 'Please select a unit to assign.',
            'unit_id.exists' => 'Selected unit does not exist.',
        ];
    }
}
