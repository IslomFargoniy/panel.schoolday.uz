<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserSchoolRequest;
use App\Models\UserSchool;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class UserSchoolController extends Controller
{
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserSchoolRequest $request)
    {
        if (!Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            abort(403, 'Unauthorized');
        }

        try {
            UserSchool::firstOrCreate($request->validated());

            return back()->with('success', __('Foydalanuvchi maktabga biriktirildi.'));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage()],
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UserSchool $userSchool)
    {
        if (!Auth::user()->hasRole('Admin') && !Auth::user()->hasRole('Superadmin')) {
            abort(403, 'Unauthorized');
        }

        try {
            $userSchool->delete();
            return back()->with('success', __('Foydalanuvchi maktabdan ajratildi.'));
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'error' => [$e->getMessage()],
            ]);
        }
    }
}
