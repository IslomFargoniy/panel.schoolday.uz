<?php

namespace App\Jobs;

use App\Models\BranchDevice;
use App\Services\Hikvision\HikvisionSyncService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncAllStudentsToDeviceJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $deviceId) {}

    public function handle(HikvisionSyncService $syncService): void
    {
        $device = BranchDevice::find($this->deviceId);
        if (! $device || ! $device->status || $device->connection_type !== 'isup' || empty($device->device_id)) {
            return;
        }

        try {
            $syncService->syncAllStudentsToDevice($device);
        } catch (Exception $e) {
            Log::warning("SyncAllStudentsToDeviceJob failed for device {$this->deviceId}: " . $e->getMessage());
        }
    }
}
