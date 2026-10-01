<?php

namespace App\Console\Commands;

use App\Models\BranchDevice;
use App\Services\Hikvision\HikvisionSyncService;
use Illuminate\Console\Command;

class HikvisionSyncStudentsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hikvision:sync-students {--device_id= : Specific ISUP device ID to sync} {--branch_id= : Specific Branch ID to sync}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync branch students and their face photos to Hikvision ISUP devices';

    /**
     * Execute the console command.
     */
    public function handle(HikvisionSyncService $syncService): int
    {
        $deviceId = $this->option('device_id');
        $branchId = $this->option('branch_id');

        $query = BranchDevice::where('connection_type', 'isup')
            ->where('status', 1)
            ->whereNotNull('device_id');

        if ($deviceId) {
            $query->where('device_id', $deviceId);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $devices = $query->get();

        if ($devices->isEmpty()) {
            $this->info('No active ISUP devices found.');

            return 0;
        }

        $this->info("Starting students & face sync for {$devices->count()} device(s)...");

        foreach ($devices as $device) {
            $this->line("Syncing device: {$device->device_id} (Branch ID: {$device->branch_id}, Name: {$device->name})...");
            $res = $syncService->syncAllStudentsToDevice($device);

            if ($res['success'] ?? false) {
                $this->info("✔ Device {$device->device_id}: {$res['synced_count']} student(s) synced (Total: {$res['total']}, Failed: {$res['failed_count']}).");
            } else {
                $this->error("✖ Device {$device->device_id} sync failed: " . ($res['message'] ?? 'Unknown error'));
            }
        }

        $this->info('Students sync completed.');

        return 0;
    }
}
