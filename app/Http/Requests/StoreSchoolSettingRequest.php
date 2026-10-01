<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('Admin') || $this->user()?->hasRole('Superadmin');
    }

    public function rules(): array
    {
        return [
            'school_id' => ['required', 'exists:schools,id'],
            'webhook_url' => ['nullable', 'string', 'max:500'],
            'sms_sender' => ['nullable', 'string', 'max:255'],
            'telegram_channel_id' => ['nullable', 'string', 'max:255'],
            'timezone' => ['nullable', 'string', 'max:100'],
        ];
    }
}
