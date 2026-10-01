<?php

namespace App\Jobs;

use App\Models\BranchDevice;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeleteStudentFromDevicesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, int>  $deviceIds
     */
    public function __construct(public string $employeeNo, public array $deviceIds) {}

    public function handle(): void
    {
        if (empty($this->deviceIds) || empty($this->employeeNo)) {
            return;
        }

        $devices = BranchDevice::whereIn('id', $this->deviceIds)
            ->where('connection_type', 'isup')
            ->whereNotNull('device_id')
            ->get();

        $gatewayUrl = rtrim(config('hikvision.gateway_url', 'http://127.0.0.1:7671'), '/') . '/api/isapi';

        foreach ($devices as $device) {
            try {
                $payload = [
                    'device_id' => $device->device_id,
                    'method' => 'PUT',
                    'url' => 'PUT /ISAPI/AccessControl/UserInfo/Delete?format=json',
                    'body' => json_encode([
                        'UserInfoDelCond' => [
                            'EmployeeNoList' => [
                                ['employeeNo' => $this->employeeNo],
                            ],
                        ],
                    ]),
                ];

                Http::timeout(config('hikvision.timeout', 10))->post($gatewayUrl, $payload);
            } catch (Exception $e) {
                Log::warning("DeleteStudentFromDevicesJob failed for employee {$this->employeeNo} on device {$device->device_id}: " . $e->getMessage());
            }
        }
    }
}
