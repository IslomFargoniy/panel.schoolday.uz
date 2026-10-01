<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        return Inertia::render('settings/index', [
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'telegram_bot_token' => 'nullable|string',
        ];

        $validated = $request->validate($rules);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        if (! empty($validated['telegram_bot_token'])) {
            if (empty(config('services.telegram.webhook_secret'))) {
                // The webhook endpoint rejects every request without a secret, so do not register it
                return redirect()->back()->with('error', ['key' => 'settings.telegram_secret_missing']);
            }

            $url = url('/api/telegram/webhook');
            if (str_starts_with($url, 'https')) {
                if (! app(TelegramService::class)->setWebhook($url)) {
                    return redirect()->back()->with('error', ['key' => 'settings.telegram_webhook_failed']);
                }
            }
        }

        return redirect()->back()->with('success', ['key' => 'crud.settings_saved']);
    }
}
