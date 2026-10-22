<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Settings\SaveSystemSettings;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Superadmin: system settings. The bot token is write-only; only a masked form comes back. */
class SystemSettingController extends ApiController
{
    public function show(): JsonResponse
    {
        return $this->ok($this->payload());
    }

    public function update(Request $request, SaveSystemSettings $save): JsonResponse
    {
        $save($request->validate(SaveSystemSettings::RULES));

        return $this->ok($this->payload());
    }

    private function payload(): array
    {
        $token = (string) Setting::where('key', 'telegram_bot_token')->value('value');

        return [
            'telegram_bot_token_set' => $token !== '',
            'telegram_bot_token_masked' => $token !== '' ? substr($token, 0, 6) . '…' . substr($token, -4) : null,
        ];
    }
}
