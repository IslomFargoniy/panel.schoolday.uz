<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserSchoolRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\Tenant::isGlobalAdmin($this->user());
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'school_id' => ['required', 'exists:schools,id'],
        ];
    }
}
