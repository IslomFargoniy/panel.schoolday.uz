<?php

namespace App\Console\Commands;

use App\Models\BranchDevice;
use App\Services\Hikvision\DeviceConfigService;
use Illuminate\Console\Command;

/** Finishes setting up online ISUP terminals: fills a missing MAC address and prepares a newly added device once. */
class HikvisionEnsureDeviceConfigCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hikvision:ensure-device-config {--device= : Only this device_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fill missing MAC addresses of ISUP terminals and clean up / load students on a newly connected one';

    /**
     * Execute the console command.
     */
    public function handle(DeviceConfigService $service): int
    {
        $devices = BranchDevice::where('status', 1)
            ->where('connection_type', 'isup')
            ->where('is_online', 1)
            ->whereNotNull('device_id')
            // Only devices with something left to do: working terminals are not queried every run
            ->where(fn ($q) => $q->whereNull('mac_address')->orWhere('mac_address', '')->orWhereNull('users_cleaned_at'))
            ->when($this->option('device'), fn ($q, $id) => $q->where('device_id', $id))
            ->get();

        foreach ($devices as $device) {
            $r = $service->ensure($device);
            $this->line(sprintf('%s: mac_filled=%s users_removed=%d students_queued=%s %s',
                $device->device_id,
                $r['mac_filled'] ? 'yes' : 'no',
                $r['users_removed'],
                $r['students_queued'] ? 'yes' : 'no',
                $r['errors'] ? '(' . implode('; ', $r['errors']) . ')' : ''
            ));
        }

        return self::SUCCESS;
    }
}
