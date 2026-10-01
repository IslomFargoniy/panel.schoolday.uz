<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolSettingRequest;
use App\Models\SchoolSetting;
use Exception;
use Illuminate\Validation\ValidationException;

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

            return back()->with('success', __('Maktab sozlamalari saqlandi.'));
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('SchoolSetting save error: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'error' => [__('Maktab sozlamalarini saqlashda xatolik yuz berdi.')],
            ]);
        }
    }
}
