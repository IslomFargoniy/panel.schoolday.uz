<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\BranchDevice */
class DeviceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'device_id' => $this->device_id,
            'mac_address' => $this->mac_address,
            'connection_type' => $this->connection_type,
            'status' => (bool) $this->status,
            'is_online' => (bool) $this->is_online,
            // The key itself is never sent back
            'has_encryption_key' => ! empty($this->encryption_key),
            'last_seen_at' => $this->last_seen_at?->format('Y-m-d H:i:s'),
            'branch_id' => $this->branch_id,
            'branch_name' => $this->branch?->name,
            'school_name' => $this->branch?->school?->name,
        ];
    }
}
