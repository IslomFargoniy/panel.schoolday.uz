<?php

namespace App\Http\Controllers;

use App\Actions\Settings\SaveSystemSettings;
use App\Models\Setting;
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

    public function store(Request $request, SaveSystemSettings $save)
    {
        $save($request->validate(SaveSystemSettings::RULES));

        return redirect()->back()->with('success', ['key' => 'crud.settings_saved']);
    }
}
