<?php

namespace App\Http\Controllers;

use App\Actions\Users\DeleteUser;
use App\Actions\Users\SaveUser;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $role = $request->input('role');
        $schoolId = $request->input('school_id');
        $search = $request->input('search');

        $query = User::with(['roles', 'user_schools.school']);

        // Multi-tenant check
        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $query->whereHas('user_schools', function ($q) use ($userSchoolIds) {
                $q->whereIn('school_id', $userSchoolIds);
            });
        }

        if ($role) {
            $query->role($role);
        }

        if ($schoolId) {
            $query->whereHas('user_schools', function ($q) use ($schoolId) {
                $q->where('school_id', $schoolId);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->when(\App\Support\Phone::searchDigits($search), fn ($q, $digits) => $q->orWhere('phone', 'like', "%{$digits}%"));
            });
        }

        $users = $query->latest()->get();
        $roles = Role::all();

        $schoolsQuery = \App\Models\School::query();
        if (\Illuminate\Support\Facades\Auth::check() && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && ! \Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
            $userSchoolIds = \Illuminate\Support\Facades\Auth::user()->user_schools()->pluck('school_id');
            $schoolsQuery->whereIn('id', $userSchoolIds);
        }
        $schools = $schoolsQuery->select('id', 'name')->get();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'schools' => $schools,
            'filters' => [
                'role' => $role,
                'school_id' => $schoolId,
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request, SaveUser $save)
    {
        $save->create(SaveUser::prepare($request)->validate(SaveUser::rules()));

        return redirect()->back()->with('success', ['key' => 'crud.user_created']);
    }

    public function update(Request $request, User $user, SaveUser $save)
    {
        $save->update($user, SaveUser::prepare($request)->validate(SaveUser::rules($user)));

        return redirect()->back()->with('success', ['key' => 'crud.user_updated']);
    }

    public function destroy(Request $request, User $user, DeleteUser $delete)
    {
        $delete($user, $request->user());

        return redirect()->back()->with('success', ['key' => 'crud.user_deleted']);
    }
}
