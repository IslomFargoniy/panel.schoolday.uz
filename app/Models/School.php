<?php

namespace App\Models;

use App\Observers\SchoolObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[ObservedBy([SchoolObserver::class])]
class School extends Model
{
    use \App\Traits\FormatsDates, HasFactory;

    protected $fillable = [
        'name',
        'address',
        'comment',
        'branch_limit',
        'branch_price',
        'valid_date',
        'status',
    ];

    protected $casts = [
        'branch_limit' => 'integer',
        'branch_price' => 'decimal:2',
        'valid_date' => 'date:Y-m-d',
        'status' => 'integer',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function getValidDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return substr($value, 0, 10);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class, 'school_id');
    }

    public function user_schools(): HasMany
    {
        return $this->hasMany(UserSchool::class, 'school_id');
    }

    public function school_setting(): HasOne
    {
        return $this->hasOne(SchoolSetting::class, 'school_id');
    }
}
