<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\Tenant::isGlobalAdmin($this->user());
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'branch_limit' => ['required', 'integer', 'min:1'],
            'branch_price' => ['nullable', 'numeric', 'min:0'],
            'valid_date' => ['nullable', 'date'],
            'status' => ['nullable', 'integer', 'in:0,1'],
        ];
    }
}
