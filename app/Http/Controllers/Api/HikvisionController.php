<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchDevice;
use App\Models\BranchMacAddress;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use App\Services\Hikvision\HikvisionSyncService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Telegram\Bot\Api;

class HikvisionController extends Controller
{
    private function telegramlog($message)
    {
        $token = config('services.telegram_logging.token');
        $chat_id = config('services.telegram_logging.chat_id');

        if (! $token || ! $chat_id) {
            return;
        }

        try {
            $telegram = new Api($token);
            $telegram->sendMessage([
                'chat_id' => $chat_id,
                'text' => substr($message, 0, 4000), // Telegram message length limit info
            ]);
        } catch (Exception $e) {
            Log::error('Telegram Log Error: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            // --- 1. Parse incoming payload -----------------------------------
            // Hikvision sends multipart/form-data: the JSON blob comes as the
            // "AccessControllerEvent" field, and the face photo as "Picture".
            $rawJson = $request->input('AccessControllerEvent');

            if ($rawJson && is_string($rawJson)) {
                $eventData = json_decode($rawJson);
            } else {
                // Fallback: try the raw body (application/json)
                $eventData = json_decode($request->getContent());
            }

            if (! $eventData) {
                Log::warning('Hikvision: could not parse event payload', ['body' => $request->getContent()]);

                return response()->json(['success' => false, 'reason' => 'invalid_payload'], 400);
            }

            // --- 2. Device whitelist check & status update -------------------
            $incomingMac = strtoupper(trim($eventData->macAddress ?? ''));
            $shortSerial = $eventData->shortSerialNumber ?? null;
            $deviceId = $eventData->device_id ?? null;

            $branchDevice = null;
            if ($incomingMac || $shortSerial || $deviceId) {
                $branchDevice = BranchDevice::where('status', true)
                    ->where(function ($q) use ($incomingMac, $shortSerial, $deviceId) {
                        if ($incomingMac) {
                            $q->orWhereRaw('UPPER(mac_address) = ?', [$incomingMac]);
                        }
                        if ($shortSerial && $shortSerial !== 'default') {
                            $q->orWhere('device_id', '=', $shortSerial);
                        }
                        if ($deviceId) {
                            $q->orWhere('device_id', '=', $deviceId);
                        }
                    })
                    ->first();

                if ($branchDevice) {
                    $branchDevice->update([
                        'is_online' => true,
                        'last_seen_at' => now(),
                    ]);
                }
            }

            $totalConfigured = BranchDevice::count() + BranchMacAddress::count();
            if ($totalConfigured > 0 && $incomingMac && ! $branchDevice) {
                $allowed = BranchMacAddress::whereRaw('UPPER(mac_address) = ?', [$incomingMac])->exists()
                    || BranchDevice::whereRaw('UPPER(mac_address) = ?', [$incomingMac])->exists();
                if (! $allowed) {
                    Log::info("Hikvision: rejected event from unregistered device [{$incomingMac}]");

                    return response()->json(['success' => false, 'reason' => 'device_not_allowed'], 200);
                }
            }

            // --- 3. We only care about AccessControllerEvent type -----------
            $accessEventData = $eventData->AccessControllerEvent ?? null;

            if (! $accessEventData) {
                // Not an access-controller event — ignore silently
                return response()->json(['success' => true, 'reason' => 'ignored']);
            }

            // --- 4. Save uploaded face photo (if present) -------------------
            $filename = '';
            if ($request->hasFile('Picture')) {
                $picture = $request->file('Picture');
                $shortSerial = $eventData->shortSerialNumber ?? 'unknown_device';
                $filename = time() . '_' . rand(1, 99) . '_' . $picture->getClientOriginalName();
                $savedPath = $picture->storeAs("hikvision/{$shortSerial}", $filename, 'public');
                $filename = $savedPath; // store full relative path
            }

            // --- 5. Find the matching student --------------------------------
            $employeeNo = $accessEventData->employeeNoString ?? null;

            if ($employeeNo) {
                // Prevent multiple entries for the same student within 10 seconds
                $lockKey = 'hikvision_debounce_' . $employeeNo;
                if (! \Illuminate\Support\Facades\Cache::add($lockKey, true, 10)) {
                    Log::info("Hikvision: ignored duplicate event for employee {$employeeNo}");

                    return response()->json(['success' => true, 'reason' => 'duplicate_ignored']);
                }
            }

            $checkStudent = Student::with('schoolClass.shift')
                ->where('employeeNoString', $employeeNo)
                ->where('status', 'active')
                ->first();

            if (! $checkStudent) {
                Log::info('Hikvision: no active student found for employeeNo ' . $employeeNo);

                return response()->json(['success' => false, 'reason' => 'student_not_found']);
            }

            // --- 6. Persist HikvisionAccess (device-level row) ---------------
            $hikvisionAccess = HikvisionAccess::create([
                'ipAddress' => $eventData->ipAddress ?? null,
                'portNo' => $eventData->portNo ?? null,
                'protocol' => $eventData->protocol ?? null,
                'macAddress' => $eventData->macAddress ?? null,
                'channelId' => $eventData->channelID ?? $eventData->channelId ?? null,
                'dateTime' => isset($eventData->dateTime) ? \Carbon\Carbon::parse($eventData->dateTime) : now(),
                'activePostCount' => $eventData->activePostCount ?? null,
                'eventType' => $eventData->eventType ?? null,
                'eventState' => $eventData->eventState ?? null,
                'eventDescription' => $eventData->eventDescription ?? null,
                'shortSerialNumber' => $eventData->shortSerialNumber ?? null,
            ]);

            // --- 7. Persist HikvisionAccessEvent (event-level row) -----------
            $shift = $checkStudent->schoolClass?->shift;
            $hikvisionAccessEvent = $hikvisionAccess->events()->create([
                'deviceName' => $accessEventData->deviceName ?? null,
                'majorEventType' => $accessEventData->majorEventType ?? null,
                'subEventType' => $accessEventData->subEventType ?? null,
                'name' => $accessEventData->name ?? null,
                'cardReaderNo' => $accessEventData->cardReaderNo ?? null,
                'employeeNoString' => $accessEventData->employeeNoString ?? null,
                'serialNo' => $accessEventData->serialNo ?? null,
                'userType' => $accessEventData->userType ?? null,
                'currentVerifyMode' => $accessEventData->currentVerifyMode ?? null,
                'frontSerialNo' => $accessEventData->frontSerialNo ?? null,
                'attendanceStatus' => $accessEventData->attendanceStatus ?? null,
                'onlyVerify' => $accessEventData->onlyVerify ?? null,
                'label' => $accessEventData->label ?? null,
                'mask' => $accessEventData->mask ?? null,
                'picturesNumber' => $accessEventData->picturesNumber ?? null,
                'purePwdVerifyEnable' => $accessEventData->purePwdVerifyEnable ?? null,
                'picture' => $filename,
                'start_time' => $shift?->start_time,
                'end_time' => $shift?->end_time,
            ]);

            // --- 8. Persist FaceRect (if present) ----------------------------
            $faceRectRaw = $accessEventData->FaceRect ?? $eventData->FaceRect ?? null;
            $faceRectData = json_decode(json_encode($faceRectRaw), true);
            if ($faceRectData) {
                $hikvisionAccessEvent->faceRects()->create([
                    'height' => $faceRectData['height'] ?? null,
                    'width' => $faceRectData['width'] ?? null,
                    'x' => $faceRectData['x'] ?? null,
                    'y' => $faceRectData['y'] ?? null,
                ]);
            }

            return response()->json(['success' => true]);

        } catch (Exception $e) {
            $this->telegramlog('Xatolik: ' . $e->getMessage() . ' line:' . $e->getLine());
            Log::error('HikvisionController@store exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Provide device encryption key to ISUP daemon
     */
    public function getDeviceKey(Request $request)
    {
        $deviceId = $request->query('device_id') ?? $request->query('deviceId') ?? $request->input('device_id') ?? $request->input('deviceId');
        if (! $deviceId) {
            return response()->json(['error' => 'Device ID required'], 400);
        }

        $device = BranchDevice::where('device_id', $deviceId)->first();
        $key = ($device && ! empty($device->encryption_key)) ? $device->encryption_key : 'SchoolDay142026';

        return response()->json([
            'success' => true,
            'device_id' => $deviceId,
            'deviceId' => $deviceId,
            'key' => $key,
            'encryption_key' => $key,
        ]);
    }

    /**
     * Receive device status heartbeat from ISUP daemon
     */
    public function updateDeviceStatus(Request $request)
    {
        $deviceId = $request->input('device_id') ?? $request->input('deviceId') ?? $request->query('device_id') ?? $request->query('deviceId');
        $status = $request->input('status') ?? $request->query('status'); // 'online' or 'offline'
        $ip = $request->input('ip') ?? $request->query('ip');
        $serial = $request->input('serial') ?? $request->query('serial');

        if ($deviceId) {
            $device = BranchDevice::where('device_id', $deviceId)->first();
            if ($device) {
                $isOnline = in_array($status, ['online', true, 1, '1'], true);
                $device->update([
                    'is_online' => $isOnline,
                    'status' => true,
                    'last_seen_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Manually trigger ISUP event sync for a device
     */
    public function syncDeviceEvents(BranchDevice $device, HikvisionSyncService $syncService)
    {
        $res = $syncService->syncEventsFromDevice($device);

        return response()->json($res);
    }
}
