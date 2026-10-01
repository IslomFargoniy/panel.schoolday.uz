<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Telegram\TelegramService;
use Illuminate\Http\Request;

class TelegramController extends Controller
{
    public function handle(Request $request, TelegramService $telegramService)
    {
        $secret = (string) config('services.telegram.webhook_secret');
        $header = (string) $request->header('X-Telegram-Bot-Api-Secret-Token', '');

        if ($secret === '' || ! hash_equals($secret, $header)) {
            abort(403, 'Unauthorized webhook request.');
        }

        $telegramService->handleUpdate($request->all());

        return response('OK', 200);
    }
}
