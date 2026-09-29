<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Observers\SchoolObserver;

#[ObservedBy([SchoolObserver::class])]
class School extends Model
{
    use HasFactory;

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
        'valid_date' => 'date',
        'status' => 'integer',
    ];

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

    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(Student::class, Branch::class, 'school_id', 'branch_id');
    }
}
