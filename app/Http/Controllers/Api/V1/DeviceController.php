<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\DeviceResource;
use App\Models\BranchDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $devices = $this->scoped(BranchDevice::with('branch.school'), 'branch', $request)
            ->when($request->filled('is_online'), fn ($q) => $q->where('is_online', $request->boolean('is_online')))
            ->orderByDesc('is_online')
            ->orderBy('name')
            ->get();

        return $this->ok(DeviceResource::collection($devices));
    }
}
