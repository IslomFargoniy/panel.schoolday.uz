<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchDeviceRequest extends FormRequest
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

        $branch = \App\Models\Branch::find($this->input('branch_id'));

        return $branch ? \App\Support\Tenant::canAccessSchool($branch->school_id, $user) : false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'mac_address' => \App\Support\MacAddress::normalizeOrKeep($this->mac_address),
            'name' => $this->name && trim($this->name) !== '' ? trim($this->name) : null,
            'device_id' => $this->device_id && trim($this->device_id) !== '' ? trim($this->device_id) : null,
            'encryption_key' => $this->encryption_key && trim($this->encryption_key) !== '' ? trim($this->encryption_key) : null,
            'connection_type' => $this->connection_type ?: 'isup',
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
            'mac_address' => 'required_if:connection_type,http_listening|nullable|string|max:255|regex:' . \App\Support\MacAddress::REGEX,
            'name' => 'nullable|string|max:255',
            'device_id' => 'required_if:connection_type,isup|nullable|string|max:255|unique:branch_devices,device_id',
            'connection_type' => 'nullable|in:isup,http_listening',
            'encryption_key' => 'nullable|string|max:255',
        ];
    }
}
