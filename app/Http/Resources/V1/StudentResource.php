<?php

namespace App\Http\Resources\V1;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Student */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $class = $this->relationLoaded('schoolClass') ? $this->schoolClass : null;
        $shift = $class?->relationLoaded('shift') ? $class->shift : null;
        $branch = $shift?->relationLoaded('branch') ? $shift->branch : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'employee_no' => $this->employeeNoString,
            'status' => $this->status,
            'gender' => $this->gender,
            'face_image' => MediaUrl::from($this->face_image),
            'telegram_linked' => (bool) $this->telegram_id,
            'class_id' => $this->class_id,
            'class_name' => $class?->name,
            'shift_name' => $shift?->name,
            'branch_name' => $branch?->name,
        ];
    }
}
