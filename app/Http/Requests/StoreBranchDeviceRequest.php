<?php

namespace App\Http\Requests;

use App\Models\BranchDevice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

        // A typed ISUP Device ID without a key still gets one (the terminal can't log in without it)
        if ($this->input('connection_type') === 'isup' && $this->input('device_id') && ! $this->input('encryption_key')) {
            $this->merge(['encryption_key' => BranchDevice::generateIsupKey()]);
        }
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
            // Left empty, a unique Device ID and key are generated (BranchDeviceObserver::creating)
            'device_id' => [
                'nullable',
                'string',
                'max:255',
                // Only the terminal's ISUP settings refuse other signs
                Rule::when($this->input('connection_type') === 'isup', ['regex:' . BranchDevice::ISUP_ID_PATTERN]),
                Rule::unique('branch_devices', 'device_id'),
            ],
            'connection_type' => 'nullable|in:isup,http_listening',
            'encryption_key' => [
                'nullable',
                'string',
                'max:255',
                Rule::when($this->input('connection_type') === 'isup', ['regex:' . BranchDevice::ISUP_KEY_PATTERN, 'different:device_id']),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'mac_address.required_if' => 'HTTP Listening uchun MAC manzil kerak.',
            'device_id.regex' => "Device ID faqat lotin harflari va raqamlardan iborat bo'lishi kerak (1-32 belgi).",
            'device_id.unique' => 'Bu Device ID boshqa qurilmada band.',
            'encryption_key.regex' => "Kalit 8-16 belgi: katta va kichik harf hamda raqam bo'lishi kerak.",
            'encryption_key.different' => "Kalit Device ID bilan bir xil bo'lmasin.",
        ];
    }
}
