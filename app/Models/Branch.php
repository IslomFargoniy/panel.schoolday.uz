<?php

namespace App\Models;

use App\Observers\BranchObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([BranchObserver::class])]
class Branch extends Model
{
    use \App\Traits\FormatsDates;

    protected $fillable = ['school_id', 'name', 'description'];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(BranchDevice::class);
    }

    public function branch_devices(): HasMany
    {
        return $this->hasMany(BranchDevice::class);
    }

    public function macAddresses(): HasMany
    {
        return $this->hasMany(BranchDevice::class);
    }
}
