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
        return rtrim(config('hikvision.gateway_url'), '/') . '/api/isapi';
    }

    /**
     * Sync single student (and face photo) to all devices in student's branch
     */
    public function syncStudent(Student $student): array
    {
        $results = [];

        $branch = $student->schoolClass?->shift?->branch;
        if (! $branch) {
            $student->load('schoolClass.shift.branch.devices');
            $branch = $student->schoolClass?->shift?->branch;
        }

        if (! $branch) {
            return ['success' => false, 'message' => 'Student has no assigned branch'];
        }

        $devices = $branch->devices ?? [];

        foreach ($devices as $device) {
            $results[$device->id] = $this->syncStudentToDevice($student, $device);
        }

        return $results;
    }

    /**
     * Sync single student to a specific branch device via ISAPI/ISUP
     */
    public function syncStudentToDevice(Student $student, BranchDevice $device): array
    {
        if (! $device->status) {
            return ['success' => false, 'message' => 'Device is disabled'];
        }

        try {
            $employeeNo = (string) ($student->employeeNoString ?: $student->id);
            $name = $student->name ?: 'Student ' . $employeeNo;

            $validBegin = $student->valid_begin
                ? $student->valid_begin->format('Y-m-d\TH:i:s')
                : Carbon::now()->format('Y-m-d\T00:00:00');
            $validEnd = $student->valid_end
                ? $student->valid_end->format('Y-m-d\TH:i:s')
                : Carbon::now()->addYears(10)->format('Y-m-d\T23:59:59');

            $userData = [
                'UserInfo' => [
                    'employeeNo' => $employeeNo,
                    'name' => $name,
                    'userType' => 'normal',
                    'closeDelayEnabled' => false,
                    'Valid' => [
                        'enable' => (bool) $student->valid_enabled,
                        'beginTime' => $validBegin,
                        'endTime' => $validEnd,
                        'timeType' => 'local',
                    ],
                    'doorRight' => (string) ($student->door_right ?: '1'),
                    'RightPlan' => [
                        [
                            'doorNo' => 1,
                            'planTemplateNo' => (string) ($student->plan_template_no ?: '1'),
                        ],
                    ],
                    'gender' => $student->gender ?: 'unknown',
                    'localUIRight' => (bool) $student->local_ui_right,
                    'userVerifyMode' => $student->user_verify_mode ?: 'cardOrFace',
                ],
            ];

            // Route through ISUP Gateway
            if ($device->connection_type === 'isup' && ! empty($device->device_id)) {
                $isupRes = Http::timeout(config('hikvision.timeout', 10))->post($this->gatewayUrl(), [
                    'device_id' => $device->device_id,
                    'method' => 'POST',
                    'url' => 'POST /ISAPI/AccessControl/UserInfo/Record?format=json',
                    'body' => json_encode($userData),
                ]);

                $status = $isupRes->json();

                // Upload face picture via ISUP using public FaceURL
                if (! empty($student->face_image)) {
                    $faceUrl = null;
                    if (str_starts_with($student->face_image, 'http://') || str_starts_with($student->face_image, 'https://')) {
                        $faceUrl = $student->face_image;
                    } else {
                        $storagePath = str_replace('/storage/', '', $student->face_image);
                        if (\Illuminate\Support\Facades\Storage::disk('public')->exists($storagePath)) {
                            $faceUrl = url('storage/' . ltrim($storagePath, '/'));
                        }
                    }

                    if ($faceUrl) {
                        $facePayload = [
                            'faceLibType' => 'blackFD',
                            'FDID' => '1',
                            'FPID' => $employeeNo,
                            'faceURL' => $faceUrl,
                        ];

                        $faceRes = Http::timeout(config('hikvision.timeout', 10))->post($this->gatewayUrl(), [
                            'device_id' => $device->device_id,
                            'method' => 'POST',
                            'url' => 'POST /ISAPI/Intelligent/FDLib/FaceDataRecord?format=json',
                            'body' => json_encode($facePayload),
                        ]);

                        Log::info("HikvisionSync [ISUP Face]: Student {$employeeNo} face uploaded", [
                            'faceUrl' => $faceUrl,
                            'response' => $faceRes->json(),
                        ]);
                    }
                }

                Log::info("HikvisionSync [ISUP]: Student {$employeeNo} synced to device {$device->device_id}", [
                    'status' => $status,
                ]);

                return ['success' => true, 'response' => $status];
            }

            return ['success' => false, 'message' => 'Device connection_type is not ISUP or device_id is missing'];

        } catch (Exception $e) {
            Log::warning("HikvisionSync: Failed to sync student {$student->id} to device {$device->id}: " . $e->getMessage());

            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Delete student from all devices in student's branch
     */
    public function deleteStudent(Student $student): array
    {
        $results = [];

        $branch = $student->schoolClass?->shift?->branch;
        if (! $branch) {
            $student->load('schoolClass.shift.branch.devices');
            $branch = $student->schoolClass?->shift?->branch;
        }

        $devices = $branch->devices ?? [];
        $employeeNo = (string) ($student->employeeNoString ?: $student->id);

        foreach ($devices as $device) {
            try {
                if ($device->connection_type === 'isup' && ! empty($device->device_id)) {
                    $delRes = Http::timeout(config('hikvision.timeout', 10))->post($this->gatewayUrl(), [
                        'device_id' => $device->device_id,
                        'method' => 'PUT',
                        'url' => 'PUT /ISAPI/AccessControl/UserInfo/Delete?format=json',
                        'body' => json_encode([
                            'UserInfoDelCond' => [
                                'EmployeeNoList' => [
                                    ['employeeNo' => $employeeNo],
                                ],
                            ],
                        ]),
                    ]);
                    $results[$device->id] = $delRes->json();

                    continue;
                }
            } catch (Exception $e) {
                Log::warning("HikvisionSync: Failed to delete student {$employeeNo} from device {$device->id}: " . $e->getMessage());
                $results[$device->id] = ['error' => $e->getMessage()];
            }
        }

        return $results;
    }

    /**
     * Sync ALL active students in branch to a specific device (e.g. when newly connected)
     */
    public function syncAllStudentsToDevice(BranchDevice $device): array
    {
        if (! $device->status) {
            return ['success' => false, 'message' => 'Qurilma nofaol holatda'];
        }

        $students = Student::whereHas('schoolClass.shift', function ($q) use ($device) {
            $q->where('branch_id', $device->branch_id);
        })
            ->where('status', 'active')
            ->get();

        $syncedCount = 0;
        $failedCount = 0;

        foreach ($students as $student) {
            $res = $this->syncStudentToDevice($student, $device);
            if ($res['success'] ?? false) {
                $syncedCount++;
            } else {
                $failedCount++;
            }
        }

        Log::info("HikvisionSync: Synced {$syncedCount} students to device {$device->device_id} (Failed: {$failedCount})");

        return [
            'success' => true,
            'synced_count' => $syncedCount,
            'failed_count' => $failedCount,
            'total' => $students->count(),
            'message' => "{$syncedCount} ta o‘quvchi qurilmaga sinxronlandi.",
        ];
    }

    /**
     * Query and sync attendance event logs from an ISUP device via C++ Gateway
     */
    public function syncEventsFromDevice(BranchDevice $device, ?string $startTime = null, ?string $endTime = null): array
    {
        if (empty($device->device_id) || $device->connection_type !== 'isup') {
            return ['success' => false, 'message' => 'Qurilma ISUP rejimida emas yoki Device ID mavjud emas.'];
        }

        // Check if school is active
        $school = $device->branch?->school;
        if ($school && (! $school->status || ($school->valid_date && Carbon::parse($school->valid_date)->isPast()))) {
            Log::warning("HikvisionSync: Skipped sync for device {$device->id} because school [{$school->id}] is inactive or expired.");

            return ['success' => false, 'message' => 'Maktab faol emas yoki muddati tugagan'];
        }

        $appTimezone = config('app.timezone', 'Asia/Tashkent');
        $startTime = $startTime ?: (
            $device->last_event_synced_at
                ? Carbon::parse($device->last_event_synced_at)->subMinutes(5)->format('Y-m-d\TH:i:s+05:00')
                : now()->subDays(1)->format('Y-m-d\T00:00:00+05:00')
        );
        $endTime = $endTime ?: now()->addHours(1)->format('Y-m-d\TH:i:s+05:00');

        try {
            $syncStartedAt = now();
            $syncedCount = 0;
            $position = 0;
            $maxPerReq = 100;
            $totalMatches = 1;
            $fullyRead = false;
            $failureReason = null;

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
                    $failureReason = 'Gateway HTTP ' . $res->status();
                    break;
                }

                $body = $res->json();
                $rawResponse = $body['response'] ?? '';
                $acsData = is_string($rawResponse) ? json_decode($rawResponse, true) : $rawResponse;

                if (! isset($acsData['AcsEvent'])) {
                    $failureReason = 'Gateway javobida AcsEvent yo\'q';
                    break;
                }

                $totalMatches = (int) ($acsData['AcsEvent']['totalMatches'] ?? 0);
                $numOfMatches = (int) ($acsData['AcsEvent']['numOfMatches'] ?? 0);
                $infoList = $acsData['AcsEvent']['InfoList'] ?? [];

                if (empty($infoList)) {
                    // No (more) matching events: the query itself succeeded
                    $fullyRead = true;
                    break;
                }

                // Batch load students for this page
                $employeeNos = collect($infoList)->pluck('employeeNoString')->filter()->map(fn ($e) => (string) $e)->unique()->values()->all();
                $students = Student::with('schoolClass.shift')
                    ->whereIn('employeeNoString', $employeeNos)
                    ->where('status', 'active')
                    ->get()
                    ->keyBy('employeeNoString');

                // Batch duplicate detection: by serialNo and by (employeeNo + dateTime)
                $serialNos = collect($infoList)->pluck('serialNo')->filter()->map(fn ($s) => (string) $s)->unique()->values()->all();
                $existingBySerial = [];
                if (! empty($serialNos)) {
                    // serialNo is only unique per device, so scope strictly to this device
                    $existingBySerial = HikvisionAccessEvent::whereIn('serialNo', $serialNos)
                        ->whereHas('access', function ($q) use ($device) {
                            $q->where(function ($inner) use ($device) {
                                $inner->where('shortSerialNumber', $device->device_id);
                                if (! empty($device->mac_address)) {
                                    $inner->orWhere('macAddress', $device->mac_address);
                                }
                            });
                        })
                        ->pluck('serialNo')
                        ->map(fn ($s) => (string) $s)
                        ->flip()
                        ->all();
                }

                $dateTimes = [];
                foreach ($infoList as $evt) {
                    if (! empty($evt['time'])) {
                        $dateTimes[] = Carbon::parse($evt['time'])->setTimezone($appTimezone)->format('Y-m-d H:i:s');
                    }
                }
                $dateTimes = array_unique($dateTimes);

                $existingByEmployeeTime = [];
                if (! empty($employeeNos) && ! empty($dateTimes)) {
                    $existingEvents = HikvisionAccessEvent::whereIn('employeeNoString', $employeeNos)
                        ->whereHas('access', function ($q) use ($dateTimes) {
                            $q->whereIn('dateTime', $dateTimes);
                        })
                        ->with('access:id,dateTime')
                        ->get();

                    foreach ($existingEvents as $ev) {
                        $dtStr = $ev->access?->dateTime ? Carbon::parse($ev->access->dateTime)->setTimezone($appTimezone)->format('Y-m-d H:i:s') : '';
                        $existingByEmployeeTime[$ev->employeeNoString . '_' . $dtStr] = true;
                    }
                }

                foreach ($infoList as $event) {
                    $employeeNo = isset($event['employeeNoString']) ? (string) $event['employeeNoString'] : null;
                    if (empty($employeeNo)) {
                        continue;
                    }

                    $student = $students->get($employeeNo);
                    if (! $student) {
                        continue;
                    }

                    $rawTime = $event['time'] ?? null;
                    if (! $rawTime) {
                        continue;
                    }

                    $eventDateTime = Carbon::parse($rawTime)->setTimezone($appTimezone);
                    $eventDateStr = $eventDateTime->format('Y-m-d H:i:s');
                    $serialNo = (string) ($event['serialNo'] ?? '');

                    if (
                        (! empty($serialNo) && isset($existingBySerial[$serialNo])) ||
                        isset($existingByEmployeeTime[$employeeNo . '_' . $eventDateStr])
                    ) {
                        continue;
                    }

                    $attendanceStatus = $event['attendanceStatus'] ?? null;
                    if (empty($attendanceStatus) || $attendanceStatus === 'undefined') {
                        $attendanceStatus = null;
                        $label = null;
                    } else {
                        $cleanStatus = strtolower(trim((string) $attendanceStatus));
                        $label = in_array($cleanStatus, ['checkin', 'onduty', 'in'], true)
                            ? 'Keldi'
                            : (in_array($cleanStatus, ['checkout', 'offduty', 'out'], true) ? 'Ketdi' : $attendanceStatus);
                    }

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

                    if (! empty($serialNo)) {
                        $existingBySerial[$serialNo] = true;
                    }
                    $existingByEmployeeTime[$employeeNo . '_' . $eventDateStr] = true;

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
                    $fullyRead = true;
                    break;
                }
            }

            if (! $fullyRead) {
                // Do not advance last_event_synced_at: the next run must re-read this window
                Log::warning("HikvisionSync: Event sync incomplete for device {$device->id}: {$failureReason}");

                return ['success' => false, 'error' => $failureReason ?? 'Sinxronizatsiya to\'liq yakunlanmadi', 'synced_count' => $syncedCount];
            }

            $device->update(['last_event_synced_at' => $syncStartedAt]);

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
