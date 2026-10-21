<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bir kunlik davomat qatori. "Kelmagan" qatorlar bazada yo'q (is_absent_placeholder), ularning id'si null.
 *
 * @mixin \App\Models\DailyAttendance
 */
class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $absent = (bool) $this->is_absent_placeholder;

        return [
            'id' => $absent ? null : $this->id,
            'date' => $this->date,
            'status' => $absent ? 'absent' : ($this->is_late ? 'late' : 'on_time'),
            'first_check_in' => $this->first_check_in?->format('H:i:s'),
            'last_check_out' => $this->last_check_out?->format('H:i:s'),
            'is_late' => (bool) $this->is_late,
            'is_left_early' => (bool) $this->is_left_early,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'student' => $this->whenLoaded('student', fn () => new StudentResource($this->student)),
        ];
    }
}
