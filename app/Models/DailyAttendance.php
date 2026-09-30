<?php

namespace App\Models;

use App\Observers\DailyAttendanceObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([DailyAttendanceObserver::class])]
class DailyAttendance extends Model
{
    use \App\Traits\FormatsDates;

    protected $fillable = [
        'student_id', 'date', 'first_check_in', 'last_check_out',
        'is_late', 'is_left_early', 'start_time', 'end_time',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'first_check_in' => 'datetime:Y-m-d H:i:s',
        'last_check_out' => 'datetime:Y-m-d H:i:s',
        'is_late' => 'boolean',
        'is_left_early' => 'boolean',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function getDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return substr($value, 0, 10);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
