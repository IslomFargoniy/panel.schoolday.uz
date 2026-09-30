<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSchoolSettingRequest;
use App\Models\SchoolSetting;
use Exception;
use Illuminate\Support\Facades\Auth;
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

            if (! Auth::user()->hasRole('Admin') && ! Auth::user()->hasRole('Superadmin')) {
                Auth::user()->user_schools()
                    ->where('school_id', $schoolId)
                    ->firstOrFail();
            }

            SchoolSetting::updateOrCreate(
                ['school_id' => $schoolId],
                $request->validated()
            );

            return back()->with('success', __('Maktab sozlamalari saqlandi.'));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw ValidationException::withMessages([
                'error' => ['Sizda bu maktab sozlamalarini o‘zgartirish huquqi yo‘q.'],
            ]);
        } catch (Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage()],
            ]);
        }
    }
}
