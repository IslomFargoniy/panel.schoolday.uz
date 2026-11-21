<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSchoolSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The API passes the school in the URL, the web form in the body
        $school = $this->route('school');
        $schoolId = $school instanceof \App\Models\School ? $school->id : (int) $this->input('school_id');

        return \App\Support\Tenant::canAccessSchool($schoolId ?: null, $this->user());
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
