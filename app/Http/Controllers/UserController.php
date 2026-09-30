<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
        if (\Illuminate\Support\Facades\Auth::check() && !\Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && !\Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
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
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->get();
        $roles = Role::all();

        $schoolsQuery = \App\Models\School::query();
        if (\Illuminate\Support\Facades\Auth::check() && !\Illuminate\Support\Facades\Auth::user()->hasRole('Admin') && !\Illuminate\Support\Facades\Auth::user()->hasRole('Superadmin')) {
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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        $user->assignRole($validated['role']);

        return redirect()->back()->with('success', 'Foydalanuvchi yaratildi.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        $data = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);
        $user->syncRoles([$validated['role']]);

        return redirect()->back()->with('success', 'Foydalanuvchi yangilandi.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->with('error', 'O\'zingizni o\'chira olmaysiz.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'Foydalanuvchi o\'chirildi.');
    }
}
