<?php

namespace App\Http\Resources\V1;

use App\Support\MediaUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HikvisionAccessEvent */
class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $student = $this->relationLoaded('student') ? $this->student : null;

        return [
            'id' => $this->id,
            'time' => $this->access?->dateTime?->format('Y-m-d H:i:s'),
            'device_name' => $this->deviceName,
            'name' => $student?->name ?? $this->name,
            'employee_no' => $this->employeeNoString,
            'picture' => MediaUrl::from($this->picture),
            'student_id' => $student?->id,
            'class_name' => $student?->relationLoaded('schoolClass') ? $student->schoolClass?->name : null,
        ];
    }
}
