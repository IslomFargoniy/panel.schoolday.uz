<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = ['name', 'description'];

    public function shifts(): HasMany
    {
        return $this->hasMany(Shift::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(BranchDevice::class);
    }

    public function macAddresses(): HasMany
    {
        return $this->hasMany(BranchDevice::class);
    }
}
