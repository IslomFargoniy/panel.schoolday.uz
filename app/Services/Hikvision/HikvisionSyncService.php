<?php

namespace App\Services\Hikvision;

use App\Models\BranchDevice;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HikvisionSyncService
{
    protected function gatewayUrl(): string
    {
        return rtrim(config('hikvision.gateway_url', 'http://127.0.0.1:7661'), '/') . '/api/isapi';
    }

    /**
     * Query and sync attendance event logs from an ISUP device via C++ Gateway
     */
    public function syncEventsFromDevice(BranchDevice $device, ?string $startTime = null, ?string $endTime = null): array
    {
        if (empty($device->device_id) || $device->connection_type !== 'isup') {
            return ['success' => false, 'message' => 'Qurilma ISUP rejimida emas yoki Device ID mavjud emas.'];
        }

        $startTime = $startTime ?: now()->subDays(1)->format('Y-m-d\T00:00:00+05:00');
        $endTime = $endTime ?: now()->addHours(1)->format('Y-m-d\T23:59:59+05:00');

        try {
            $syncedCount = 0;
            $position = 0;
            $maxPerReq = 100;
            $totalMatches = 1;

            while ($position < $totalMatches) {
                $payload = [
                    'AcsEventCond' => [
                        'searchID' => 'schoolday_' . time() . '_' . $position,
                        'searchResultPosition' => $position,
                        'maxResults' => $maxPerReq,
                        'major' => 5, // Access granted (Face, card, fingerprint)
                        'minor' => 0, // All
                        'startTime' => $startTime,
                        'endTime' => $endTime,
                    ],
                ];

                $res = Http::timeout(config('hikvision.timeout', 10))->post($this->gatewayUrl(), [
                    'device_id' => $device->device_id,
                    'method' => 'POST',
                    'url' => 'POST /ISAPI/AccessControl/AcsEvent?format=json',
                    'body' => json_encode($payload),
                ]);

                if (! $res->successful()) {
                    break;
                }

                $body = $res->json();
                $rawResponse = $body['response'] ?? '';
                $acsData = is_string($rawResponse) ? json_decode($rawResponse, true) : $rawResponse;

                if (! isset($acsData['AcsEvent'])) {
                    break;
                }

                $totalMatches = (int) ($acsData['AcsEvent']['totalMatches'] ?? 0);
                $numOfMatches = (int) ($acsData['AcsEvent']['numOfMatches'] ?? 0);
                $infoList = $acsData['AcsEvent']['InfoList'] ?? [];

                if (empty($infoList)) {
                    break;
                }

                foreach ($infoList as $event) {
                    $employeeNo = $event['employeeNoString'] ?? null;
                    if (empty($employeeNo)) {
                        continue;
                    }

                    $student = Student::with('schoolClass.shift')
                        ->where('employeeNoString', $employeeNo)
                        ->where('status', 'active')
                        ->first();

                    if (! $student) {
                        continue;
                    }

                    $rawTime = $event['time'] ?? null;
                    if (! $rawTime) {
                        continue;
                    }

                    $eventDateTime = Carbon::parse($rawTime)->timezone('Asia/Tashkent');
                    $eventDateStr = $eventDateTime->format('Y-m-d H:i:s');
                    $serialNo = (string) ($event['serialNo'] ?? '');

                    // Check for duplicate by employeeNo and exact access dateTime
                    $existing = HikvisionAccessEvent::where('employeeNoString', $employeeNo)
                        ->whereHas('access', function ($q) use ($eventDateStr) {
                            $q->where('dateTime', $eventDateStr);
                        })
                        ->exists();

                    if ($existing) {
                        continue;
                    }

                    $attendanceStatus = $event['attendanceStatus'] ?? null;
                    if (empty($attendanceStatus) || $attendanceStatus === 'undefined') {
                        $attendanceStatus = 'checkIn';
                    }

                    $label = ($attendanceStatus === 'checkIn') ? 'Keldi' : 'Ketdi';
                    $shift = $student->schoolClass?->shift;

                    $access = HikvisionAccess::create([
                        'ipAddress' => null,
                        'macAddress' => $device->mac_address,
                        'shortSerialNumber' => $device->device_id,
                        'dateTime' => $eventDateStr,
                        'eventType' => 'AccessControl',
                        'eventDescription' => 'ISUP AcsEvent Sync',
                    ]);

                    $eventModel = new HikvisionAccessEvent([
                        'deviceName' => $device->name ?: 'Hikvision Terminal',
                        'name' => $event['name'] ?? $student->name,
                        'employeeNoString' => $employeeNo,
                        'serialNo' => $serialNo,
                        'attendanceStatus' => $attendanceStatus,
                        'label' => $label,
                        'currentVerifyMode' => $event['currentVerifyMode'] ?? 'face',
                        'start_time' => $shift?->start_time,
                        'end_time' => $shift?->end_time,
                    ]);
                    $eventModel->hikvision_access_id = $access->id;
                    $eventModel->timestamps = false;
                    $eventModel->created_at = $eventDateTime;
                    $eventModel->updated_at = $eventDateTime;
                    $eventModel->save();

                    if (isset($event['FaceRect']) && is_array($event['FaceRect'])) {
                        $eventModel->faceRects()->create([
                            'height' => $event['FaceRect']['height'] ?? null,
                            'width' => $event['FaceRect']['width'] ?? null,
                            'x' => $event['FaceRect']['x'] ?? null,
                            'y' => $event['FaceRect']['y'] ?? null,
                        ]);
                    }

                    $syncedCount++;
                }

                $position += $numOfMatches;
                if ($numOfMatches === 0 || $position >= $totalMatches) {
                    break;
                }
            }

            Log::info("HikvisionSync [ISUP Events]: Device {$device->device_id} synced {$syncedCount} events.");

            return ['success' => true, 'synced_count' => $syncedCount];

        } catch (Exception $e) {
            Log::warning("HikvisionSync: Event sync failed for device {$device->id}: " . $e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Sync attendance events from all active ISUP devices
     */
    public function syncAllISUPDevicesEvents(): array
    {
        $devices = BranchDevice::where('connection_type', 'isup')
            ->where('status', 1)
            ->whereNotNull('device_id')
            ->get();

        $results = [];
        foreach ($devices as $device) {
            $results[$device->device_id] = $this->syncEventsFromDevice($device);
        }

        return $results;
    }
}
