<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchDevice;
use App\Models\HikvisionAccess;
use App\Models\HikvisionAccessEvent;
use App\Models\Student;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
                'text' => substr($message, 0, 4000),
            ]);
        } catch (Exception $e) {
            Log::error('Telegram Log Error: ' . $e->getMessage());
        }
    }

    /**
     * Check if request is from localhost or has valid X-Gateway-Secret header.
     */
    private function isGatewayAuthorized(Request $request): bool
    {
        $ip = $request->ip();
        if (config('hikvision.trust_localhost', true) && ($ip === '127.0.0.1' || $ip === '::1')) {
            return true;
        }

        $secret = config('hikvision.gateway_secret');
        $headerSecret = $request->header('X-Gateway-Secret');

        if (! empty($secret) && ! empty($headerSecret) && hash_equals($secret, (string) $headerSecret)) {
            return true;
        }

        return false;
    }

    public function store(Request $request)
    {
        try {
            // --- 1. Parse incoming payload -----------------------------------
            $rawJson = $request->input('AccessControllerEvent');

            if ($rawJson && is_string($rawJson)) {
                $eventData = json_decode($rawJson);
            } else {
                $eventData = json_decode($request->getContent());
            }

            if (! $eventData) {
                Log::warning('Hikvision: could not parse event payload', ['body' => $request->getContent()]);

                return response()->json(['success' => false, 'reason' => 'invalid_payload'], 400);
            }

            // --- 2. Device whitelist check & status update -------------------
            $incomingMac = strtoupper(trim($eventData->macAddress ?? ''));
            $shortSerial = $eventData->shortSerialNumber ?? null;
            $deviceId = $eventData->device_id
                ?? $eventData->deviceId
                ?? $eventData->deviceID
                ?? $request->query('device_id')
                ?? $request->query('deviceId')
                ?? $request->query('deviceID');
            $deviceId = $deviceId !== null ? (string) $deviceId : null;

            $branchDevice = null;
            if ($incomingMac || $shortSerial || $deviceId) {
                $branchDevice = BranchDevice::where('status', true)
                    ->with('branch.school')
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
            }

            if (! $branchDevice) {
                Log::info("Hikvision: rejected event from unregistered or inactive device [MAC: {$incomingMac}, Serial: {$shortSerial}, DeviceId: {$deviceId}]", [
                    'payload_keys' => array_keys((array) $eventData),
                ]);

                return response()->json(['success' => false, 'reason' => 'device_not_allowed'], 200);
            }

            // Check if school is active
            $school = $branchDevice->branch?->school;
            if ($school && (! $school->status || ($school->valid_date && Carbon::parse($school->valid_date)->isPast()))) {
                Log::warning("Hikvision: rejected event because school [{$school->id}] is inactive or expired.");

                return response()->json(['success' => false, 'reason' => 'school_inactive'], 200);
            }

            $branchDevice->update([
                'is_online' => true,
                'last_seen_at' => now(),
            ]);

            // --- 3. We only care about AccessControllerEvent type -----------
            $accessEventData = $eventData->AccessControllerEvent ?? null;

            if (! $accessEventData) {
                return response()->json(['success' => true, 'reason' => 'ignored']);
            }

            // --- 4. Find the matching student --------------------------------
            $employeeNo = $accessEventData->employeeNoString ?? null;

            // Hodisa vaqti (qurilma vaqti). Debounce va dublikat tekshiruvi shu vaqtga bog'liq.
            $payloadHasDateTime = isset($eventData->dateTime);
            $eventDateTime = $payloadHasDateTime
                ? Carbon::parse($eventData->dateTime)->setTimezone(config('app.timezone', 'Asia/Tashkent'))->format('Y-m-d H:i:s')
                : now()->setTimezone(config('app.timezone', 'Asia/Tashkent'))->format('Y-m-d H:i:s');

            if ($employeeNo) {
                // Debounce faqat BIR XIL hodisaning qayta yuborilishini (retry) to'sadi.
                // Internet tiklanganda qurilma bir o'quvchining turli vaqtdagi hodisalarini 1-2 soniya oralig'ida yuboradi,
                // ular yo'qolmasligi kerak. Payloadda vaqt bo'lmasa eski xatti-harakat (o'quvchi bo'yicha 10 soniya) saqlanadi.
                $lockKey = 'hikvision_debounce_' . $branchDevice->id . '_' . $employeeNo
                    . ($payloadHasDateTime ? '_' . $eventDateTime : '');
                if (! Cache::add($lockKey, true, 10)) {
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

            // Student must belong to this device's branch
            $studentBranchId = $checkStudent->schoolClass?->shift?->branch_id;
            if ($studentBranchId === null || (int) $studentBranchId !== (int) $branchDevice->branch_id) {
                Log::warning("Hikvision: student [{$checkStudent->id}] branch [{$studentBranchId}] does not match device branch [{$branchDevice->branch_id}]");

                return response()->json(['success' => false, 'reason' => 'student_branch_mismatch'], 200);
            }

            // --- 4b. Persistent duplicate check (employeeNo + dateTime) ------
            // Hodisa bazada allaqachon bor (masalan ISUP sync yozgan yoki qurilma qayta yuborgan): ikkinchi marta yozilmaydi,
            // davomat va Telegram xabari takrorlanmaydi.
            if ($payloadHasDateTime) {
                $existingEvent = HikvisionAccessEvent::where('employeeNoString', $employeeNo)
                    ->whereHas('access', fn ($q) => $q->where('dateTime', $eventDateTime))
                    ->first();

                if ($existingEvent) {
                    // Mavjud hodisada rasm yo'q bo'lsa, callback olib kelgan rasmni biriktiramiz
                    if (empty($existingEvent->picture) && $request->hasFile('Picture')) {
                        $picture = $request->file('Picture');
                        $rawSerial = (string) ($eventData->shortSerialNumber ?? $branchDevice->device_id ?? 'unknown');
                        $folder = preg_replace('/[^A-Za-z0-9_-]/', '', $rawSerial) ?: 'unknown';
                        $extension = $picture->guessExtension() ?: 'jpg';
                        $existingEvent->picture = $picture->storeAs("hikvision/{$folder}", Str::uuid() . '.' . $extension, 'public');
                        $existingEvent->saveQuietly();
                    }

                    return response()->json(['success' => true, 'reason' => 'duplicate_existing']);
                }
            }

            // --- 5. Save uploaded face photo (ONLY after student is verified) -
            $filename = '';
            if ($request->hasFile('Picture')) {
                $picture = $request->file('Picture');
                $rawSerial = (string) ($eventData->shortSerialNumber ?? $branchDevice->device_id ?? 'unknown');
                $sanitizedSerial = preg_replace('/[^A-Za-z0-9_-]/', '', $rawSerial);
                $folder = ! empty($sanitizedSerial) ? $sanitizedSerial : 'unknown';
                $extension = $picture->guessExtension() ?: 'jpg';
                $filename = Str::uuid() . '.' . $extension;
                $savedPath = $picture->storeAs("hikvision/{$folder}", $filename, 'public');
                $filename = $savedPath;
            }

            // --- 6. Persist HikvisionAccess (device-level row) ---------------
            $hikvisionAccess = HikvisionAccess::create([
                'ipAddress' => $eventData->ipAddress ?? null,
                'portNo' => $eventData->portNo ?? null,
                'protocol' => $eventData->protocol ?? null,
                'macAddress' => $eventData->macAddress ?? null,
                'channelId' => $eventData->channelID ?? $eventData->channelId ?? null,
                'dateTime' => $eventDateTime,
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

            return response()->json(['error' => 'Serverda xatolik yuz berdi.'], 500);
        }
    }

    /**
     * Provide device encryption key to ISUP daemon
     */
    public function getDeviceKey(Request $request)
    {
        if (! $this->isGatewayAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $deviceId = $request->query('device_id') ?? $request->query('deviceId') ?? $request->input('device_id') ?? $request->input('deviceId');
        if (! $deviceId) {
            return response()->json(['error' => 'Device ID required'], 400);
        }

        $device = BranchDevice::where('device_id', $deviceId)->first();
        $key = (! empty($device?->encryption_key)) ? $device->encryption_key : config('hikvision.default_encryption_key');

        if (empty($key)) {
            return response()->json(['error' => 'Encryption key not found'], 404);
        }

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
        if (! $this->isGatewayAuthorized($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

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
                    'last_seen_at' => now(),
                ]);
            }
        }

        return response()->json(['success' => true]);
    }
}
