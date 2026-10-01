<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolSettingRequest;
use App\Models\SchoolSetting;
use Exception;

class SchoolSettingController extends Controller
{
    /**
     * Store or update a resource in storage.
     */
    public function store(StoreSchoolSettingRequest $request)
    {
        try {
            $schoolId = $request->school_id;

            SchoolSetting::updateOrCreate(
                ['school_id' => $schoolId],
                $request->validated()
            );

            return back()->with('success', ['key' => 'crud.school_settings_saved']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SchoolSetting save error: ' . $e->getMessage());

            return back()->with('error', ['key' => 'crud.school_settings_error']);
        }
    }
}
