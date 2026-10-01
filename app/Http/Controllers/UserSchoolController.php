<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserSchoolRequest;
use App\Models\UserSchool;
use Exception;
use Illuminate\Validation\ValidationException;

class UserSchoolController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserSchoolRequest $request)
    {
        try {
            UserSchool::firstOrCreate($request->validated());

            return back()->with('success', ['key' => 'crud.user_school_attached']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('UserSchool store error: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'error' => [__('crud.error')],
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserSchool $userSchool)
    {
        if (! \App\Support\Tenant::isGlobalAdmin()) {
            abort(403, 'Unauthorized');
        }

        try {
            $userSchool->delete();

            return back()->with('success', ['key' => 'crud.user_school_detached']);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('UserSchool destroy error: ' . $e->getMessage());

            throw ValidationException::withMessages([
                'error' => [__('Foydalanuvchini maktabdan ajratishda xatolik yuz berdi.')],
            ]);
        }
    }
}
