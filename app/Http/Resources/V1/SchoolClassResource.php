<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SchoolClass */
class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $total = (int) $this->total_students;
        $present = (int) $this->present_students;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'shift_id' => $this->shift_id,
            'shift_name' => $this->shift?->name,
            'branch_name' => $this->shift?->branch?->name,
            'telegram_linked' => (bool) $this->telegram_group_id,
            'telegram_group_id' => $this->telegram_group_id,
            'branch_id' => $this->shift?->branch_id,
            'total_students' => $total,
            'present_students' => $present,
            'on_time_students' => (int) $this->on_time_students,
            'late_students' => (int) $this->late_students,
            'absent_students' => max(0, $total - $present),
        ];
    }
}
