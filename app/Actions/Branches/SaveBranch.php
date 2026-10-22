<?php

namespace App\Actions\Branches;

use App\Exceptions\ActionFailed;
use App\Models\Branch;
use App\Models\School;
use App\Models\User;
use App\Support\Tenant;

class SaveBranch
{
    /**
     * @param  array{school_id?: int|null, name: string, description?: string|null, mac_addresses?: array|null}  $data
     */
    public function create(array $data, User $user): Branch
    {
        $macAddresses = $data['mac_addresses'] ?? [];
        unset($data['mac_addresses']);

        // A school admin with one school doesn't have to pick it
        $schoolId = $data['school_id'] ?? null;
        if (! $schoolId) {
            $schoolId = $user->user_schools()->value('school_id');
        }
        if (! $schoolId && Tenant::isGlobalAdmin($user)) {
            $schoolId = School::first()?->id;
        }

        Tenant::authorizeSchool($schoolId, $user);
        $this->ensureBelowLimit(School::findOrFail($schoolId));

        $data['school_id'] = $schoolId;
        $branch = Branch::create($data);
        $this->syncMacAddresses($branch, $macAddresses);

        return $branch;
    }

    public function update(Branch $branch, array $data, User $user): Branch
    {
        $macAddresses = $data['mac_addresses'] ?? [];
        unset($data['mac_addresses']);

        if (isset($data['school_id']) && (int) $data['school_id'] !== (int) $branch->school_id) {
            Tenant::authorizeSchool((int) $data['school_id'], $user);
            $this->ensureBelowLimit(School::findOrFail($data['school_id']));
        }

        $branch->update($data);
        $this->syncMacAddresses($branch, $macAddresses);

        return $branch;
    }

    private function ensureBelowLimit(School $school): void
    {
        if ($school->branch_limit !== null && $school->branches()->count() >= $school->branch_limit) {
            throw new ActionFailed('crud.branch_limit_reached', ['limit' => $school->branch_limit]);
        }
    }

    /** HTTP-listening terminals follow the MAC list; ISUP devices are left alone. */
    private function syncMacAddresses(Branch $branch, array $macAddresses): void
    {
        $clean = collect($macAddresses)
            ->map(fn ($m) => strtoupper(trim((string) $m)))
            ->filter(fn ($m) => $m !== '')
            ->unique()
            ->values()
            ->toArray();

        $branch->devices()->where('connection_type', 'http_listening')->whereNotIn('mac_address', $clean)->delete();

        foreach ($clean as $mac) {
            $branch->devices()->firstOrCreate(
                ['mac_address' => $mac],
                [
                    'name' => 'Hikvision Terminal',
                    'device_id' => null,
                    'connection_type' => 'http_listening',
                    'status' => true,
                ]
            );
        }
    }
}
