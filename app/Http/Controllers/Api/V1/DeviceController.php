<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StoreBranchDeviceRequest;
use App\Http\Requests\UpdateBranchDeviceRequest;
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
            ->when($request->filled('connection_type'), fn ($q) => $q->where('connection_type', $request->input('connection_type')))
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', '%' . $request->input('search') . '%')
                ->orWhere('mac_address', 'like', '%' . $request->input('search') . '%')
                ->orWhere('device_id', 'like', '%' . $request->input('search') . '%')))
            ->orderByDesc('is_online')
            ->orderBy('name')
            ->get();

        return $this->ok(DeviceResource::collection($devices));
    }

    public function store(StoreBranchDeviceRequest $request): JsonResponse
    {
        $device = BranchDevice::create($request->validated());

        return $this->ok(new DeviceResource($device->load('branch.school')), status: 201);
    }

    public function update(UpdateBranchDeviceRequest $request, BranchDevice $device): JsonResponse
    {
        $this->authorize('update', $device);

        $data = $request->validated();
        // The app never sees the key: a blank field with keep_encryption_key=1 leaves it as it is
        if ($request->boolean('keep_encryption_key') && empty($data['encryption_key'])) {
            unset($data['encryption_key']);
        }

        $device->update($data);

        return $this->ok(new DeviceResource($device->load('branch.school')));
    }

    public function destroy(BranchDevice $device): JsonResponse
    {
        $this->authorize('delete', $device);

        $device->delete();

        return $this->ok(null);
    }
}
