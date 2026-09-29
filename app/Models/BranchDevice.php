<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Observers\BranchDeviceObserver;

#[ObservedBy([BranchDeviceObserver::class])]
class BranchDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'name',
        'mac_address',
        'device_id',
        'connection_type',
        'status',
        'is_online',
        'last_seen_at',
        'encryption_key',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_online' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
