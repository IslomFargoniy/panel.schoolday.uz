<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ShiftRequest extends FormRequest
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

        $branchId = $this->input('branch_id');
        if ($branchId) {
            $branch = \App\Models\Branch::find($branchId);
            if (! $branch || ! \App\Support\Tenant::canAccessSchool($branch->school_id, $user)) {
                return false;
            }
        }

        $shift = $this->route('shift');
        if ($shift instanceof \App\Models\Shift) {
            return \App\Support\Tenant::canAccessSchool($shift->branch?->school_id, $user);
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'branch_id' => [
                'required',
                'exists:branches,id',
                function ($attribute, $value, $fail) {
                    $shiftId = $this->route('shift') ? $this->route('shift')->id : null;
                    $query = \App\Models\Shift::where('branch_id', $value);
                    if ($shiftId) {
                        $query->where('id', '!=', $shiftId);
                    }
                    if ($query->count() >= 2) {
                        $fail('Bitta filialga 2 tadan ortiq smena qo\'shish mumkin emas.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Smena nomini kiritish majburiy.',
            'start_time.required' => 'Boshlanish vaqtini kiritish majburiy.',
            'end_time.required' => 'Tugash vaqtini kiritish majburiy.',
            'branch_id.required' => 'Filialni tanlash majburiy.',
            'branch_id.exists' => 'Tanlangan filial topilmadi.',
        ];
    }
}
