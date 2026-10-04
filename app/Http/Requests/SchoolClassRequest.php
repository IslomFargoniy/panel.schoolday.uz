<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SchoolClassRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if (\App\Support\Tenant::isGlobalAdmin($user)) {
            return true;
        }

        $shiftId = $this->input('shift_id');
        if ($shiftId) {
            $shift = \App\Models\Shift::with('branch')->find($shiftId);
            if (! $shift || ! \App\Support\Tenant::canAccessSchool($shift->branch?->school_id, $user)) {
                return false;
            }
        }

        $schoolClass = $this->route('schoolClass') ?? $this->route('class');
        if ($schoolClass instanceof \App\Models\SchoolClass) {
            return \App\Support\Tenant::canAccessSchool($schoolClass->shift?->branch?->school_id, $user);
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('telegram_group_id')) {
            $val = trim((string) $this->telegram_group_id);
            $this->merge([
                'telegram_group_id' => $val !== '' ? $val : null,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'shift_id' => 'required|exists:shifts,id',
            'telegram_group_id' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Sinf nomini kiritish majburiy.',
            'shift_id.required' => 'Smenani tanlash majburiy.',
            'shift_id.exists' => 'Tanlangan smena topilmadi.',
        ];
    }
}
