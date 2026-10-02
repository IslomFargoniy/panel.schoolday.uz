<?php

namespace App\Models;

use App\Observers\BranchDeviceObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([BranchDeviceObserver::class])]
class BranchDevice extends Model
{
    use \App\Traits\FormatsDates, HasFactory;

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
        'last_event_synced_at',
    ];

    protected $casts = [
        'status' => 'boolean',
        'is_online' => 'boolean',
        'last_seen_at' => 'datetime:Y-m-d H:i:s',
        'last_event_synced_at' => 'datetime:Y-m-d H:i:s',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * Qurilma aloqada ekanini belgilaydi. ISUP qurilma uzoq vaqt aloqasiz bo'lib qaytgan bo'lsa,
     * offline davridagi hodisalarni to'ldirish uchun catch-up job navbatga qo'yiladi.
     */
    public function markSeen(): void
    {
        $previousSeen = $this->last_seen_at ? \Carbon\Carbon::instance($this->last_seen_at) : null;

        $this->is_online = true;
        $this->last_seen_at = now();
        $this->save();

        \App\Jobs\CatchUpDeviceEventsJob::dispatchIfGap($this, $previousSeen);
    }
}
