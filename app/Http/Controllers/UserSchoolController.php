<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserSchoolRequest;
use App\Models\UserSchool;
use Exception;

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

            return back()->with('error', ['key' => 'crud.user_school_attach_error']);
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

            return back()->with('error', ['key' => 'crud.user_school_detach_error']);
        }
    }
}
