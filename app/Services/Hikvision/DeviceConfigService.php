<?php

namespace App\Services\Hikvision;

use App\Jobs\SyncAllStudentsToDeviceJob;
use App\Models\BranchDevice;
use App\Models\Student;
use App\Support\MacAddress;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Keeps a connected ISUP terminal in order, so nobody has to touch the device:
 *
 *  - MAC address: a device added without one gets it from /ISAPI/System/deviceInfo, so events that
 *    name the device only by MAC are still matched to it. A MAC typed by hand is never replaced.
 *  - first connection: a newly added terminal (users_cleaned_at empty) may still hold the users of
 *    the school/branch it served before; those that are not active students of its branch are removed
 *    once, then the branch's active students are written to it.
 *
 * Talks to the device through the gateway's ISAPI passthrough.
 */
class DeviceConfigService
{
    /** Users removed from the device per request. */
    private const DELETE_CHUNK = 30;

    /** @return array{mac_filled:bool, users_removed:int, students_queued:bool, errors:array<int, string>} */
    public function ensure(BranchDevice $device): array
    {
        $result = ['mac_filled' => false, 'users_removed' => 0, 'students_queued' => false, 'errors' => []];

        try {
            $result['mac_filled'] = $this->ensureMacAddress($device);
        } catch (Throwable $e) {
            $result['errors'][] = 'mac: ' . $e->getMessage();
        }

        try {
            [$result['users_removed'], $result['students_queued']] = $this->prepareNewDevice($device);
        } catch (Throwable $e) {
            $result['errors'][] = 'first connection: ' . $e->getMessage();
        }

        return $result;
    }

    /** Reads the MAC address of a device saved without one; one typed by hand is never replaced. */
    private function ensureMacAddress(BranchDevice $device): bool
    {
        if (filled($device->mac_address)) {
            return false;
        }

        $mac = MacAddress::normalize($this->tag($this->isapi($device, 'GET', '/ISAPI/System/deviceInfo'), 'macAddress'));
        if ($mac === null) {
            throw new RuntimeException('deviceInfo has no MAC address');
        }

        $device->forceFill(['mac_address' => $mac])->save();
        Log::info('DeviceConfig: MAC address filled', ['device' => $device->device_id, 'mac' => $mac]);

        return true;
    }

    /**
     * Once per newly added device: removes every user on the terminal that is not an active student of
     * the device's branch, then queues writing the branch's students to it. Not run while the branch has
     * no active students, so a misconfigured branch never empties a device.
     *
     * @return array{0:int, 1:bool} [users removed, students queued]
     */
    private function prepareNewDevice(BranchDevice $device): array
    {
        if ($device->users_cleaned_at !== null) {
            return [0, false];
        }

        $keep = Student::whereHas('schoolClass.shift', fn ($q) => $q->where('branch_id', $device->branch_id))
            ->where('status', 'active')
            ->get(['id', 'employeeNoString'])
            ->map(fn (Student $s) => (string) ($s->employeeNoString ?: $s->id))
            ->flip();
        if ($keep->isEmpty()) {
            return [0, false];
        }

        $leftover = array_values(array_filter(
            array_map('strval', array_keys($this->deviceUsers($device))),
            fn (string $no) => ! $keep->has($no)
        ));
        foreach (array_chunk($leftover, self::DELETE_CHUNK) as $chunk) {
            $this->isapi($device, 'PUT', '/ISAPI/AccessControl/UserInfo/Delete?format=json', json_encode([
                'UserInfoDelCond' => ['EmployeeNoList' => array_map(fn (string $no) => ['employeeNo' => $no], $chunk)],
            ]));
        }

        $device->forceFill(['users_cleaned_at' => now()])->save();
        if ($leftover) {
            Log::warning('DeviceConfig: leftover users removed from a new device', ['device' => $device->device_id, 'removed' => $leftover]);
        }

        SyncAllStudentsToDeviceJob::dispatch($device->id);

        return [count($leftover), true];
    }

    /** @return array<string, int> employeeNo => number of faces, for every user on the terminal */
    private function deviceUsers(BranchDevice $device): array
    {
        $users = [];
        $position = 0;
        for ($page = 0; $page < 200; $page++) {
            $body = json_encode(['UserInfoSearchCond' => [
                'searchID' => 'schoolday-' . $device->id, 'searchResultPosition' => $position, 'maxResults' => 30,
            ]]);
            $res = json_decode($this->isapi($device, 'POST', '/ISAPI/AccessControl/UserInfo/Search?format=json', $body, false), true);
            $search = $res['UserInfoSearch'] ?? null;
            if (! is_array($search)) {
                // Never treat a failed read as "device empty"
                throw new RuntimeException('user search: unexpected answer');
            }
            foreach ($search['UserInfo'] ?? [] as $user) {
                $users[(string) $user['employeeNo']] = (int) ($user['numOfFace'] ?? 0);
            }
            $count = (int) ($search['numOfMatches'] ?? 0);
            if (($search['responseStatusStrg'] ?? '') !== 'MORE' || $count === 0) {
                break;
            }
            $position += $count;
        }

        return $users;
    }

    private function isapi(BranchDevice $device, string $method, string $url, string $body = '', bool $expectStatus = true): string
    {
        $res = Http::timeout(25)->post(rtrim((string) config('hikvision.gateway_url'), '/') . '/api/isapi', [
            'device_id' => $device->device_id,
            'method' => $method,
            'url' => "{$method} {$url}",
            'body' => $body,
        ]);
        $response = (string) ($res->json('response') ?? '');
        if (! $res->successful() || $response === '') {
            throw new RuntimeException("{$method} {$url} failed ({$res->status()})");
        }
        // XML: <statusCode>1</statusCode>, JSON: "statusCode": 1
        if ($method !== 'GET' && $expectStatus && ! preg_match('#<statusCode>1</statusCode>|"statusCode"\s*:\s*1\b#', $response)) {
            throw new RuntimeException("{$method} {$url} refused: " . substr(strip_tags($response), 0, 200));
        }

        return $response;
    }

    private function tag(string $xml, string $name): ?string
    {
        return preg_match("#<{$name}>([^<]*)</{$name}>#", $xml, $m) ? trim($m[1]) : null;
    }
}
