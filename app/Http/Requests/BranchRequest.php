<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BranchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_array($this->input('mac_addresses'))) {
            $this->merge([
                'mac_addresses' => array_values(array_filter(
                    array_map(fn ($m) => \App\Support\MacAddress::normalizeOrKeep(is_string($m) ? $m : null), $this->input('mac_addresses'))
                )),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'school_id' => 'nullable|exists:schools,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'mac_addresses' => 'nullable|array',
            'mac_addresses.*' => ['nullable', 'string', 'max:255', 'regex:' . \App\Support\MacAddress::REGEX],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Filial nomini kiritish majburiy.',
        ];
    }
}
