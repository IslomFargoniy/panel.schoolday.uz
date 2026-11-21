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
        'users_cleaned_at' => 'datetime:Y-m-d H:i:s',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'datetime:Y-m-d H:i:s',
    ];

    /** Letters and digits only: terminals refuse '-', '_', '.' and other signs in the ISUP Device ID. */
    public const ISUP_ID_PATTERN = '/^[A-Za-z0-9]{1,32}$/';

    /** 8-16 letters and digits with a capital, a small letter and a digit: terminals refuse weaker keys. */
    public const ISUP_KEY_PATTERN = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]{8,16}$/';

    /** A Device ID no other device (active or not) has, e.g. "school482913". */
    public static function generateIsupId(): string
    {
        do {
            $id = 'school' . random_int(100000, 999999);
        } while (static::query()->where('device_id', $id)->exists());

        return $id;
    }

    /** A key the terminal accepts, e.g. "Kqmxa4821". */
    public static function generateIsupKey(): string
    {
        $letters = 'abcdefghjkmnpqrstuvwxyz';
        $word = '';
        for ($i = 0; $i < 5; $i++) {
            $word .= $letters[random_int(0, strlen($letters) - 1)];
        }

        return ucfirst($word) . random_int(1000, 9999);
    }

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
