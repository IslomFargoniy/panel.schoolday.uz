<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBranchDeviceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user) {
            return false;
        }

        if (\App\Support\Tenant::isGlobalAdmin($user)) {
            return true;
        }

        $branchDevice = $this->route('branch_device') ?? $this->route('device');
        if ($branchDevice instanceof \App\Models\BranchDevice) {
            if (! \App\Support\Tenant::canAccessSchool($branchDevice->branch?->school_id, $user)) {
                return false;
            }
        }

        if ($this->has('branch_id')) {
            $branch = \App\Models\Branch::find($this->input('branch_id'));
            if (! $branch || ! \App\Support\Tenant::canAccessSchool($branch->school_id, $user)) {
                return false;
            }
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'mac_address' => $this->mac_address && trim($this->mac_address) !== '' ? strtoupper(trim($this->mac_address)) : null,
            'name' => $this->name && trim($this->name) !== '' ? trim($this->name) : null,
            'device_id' => $this->device_id && trim($this->device_id) !== '' ? trim($this->device_id) : null,
            'encryption_key' => $this->encryption_key && trim($this->encryption_key) !== '' ? trim($this->encryption_key) : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_id' => 'required|exists:branches,id',
            'mac_address' => 'required_if:connection_type,http_listening|nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'device_id' => 'required_if:connection_type,isup|nullable|string|max:255',
            'connection_type' => 'nullable|in:isup,http_listening',
            'encryption_key' => 'nullable|string|max:255',
        ];
    }
}
