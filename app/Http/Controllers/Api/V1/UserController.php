<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\Users\DeleteUser;
use App\Actions\Users\SaveUser;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

/** Users: full management is Superadmin only; search (to attach someone to a school) is for Admin too. */
class UserController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with(['roles', 'user_schools.school'])
            ->when($request->filled('role'), fn ($q) => $q->role($request->input('role')))
            ->when($request->filled('school_id'), fn ($q) => $q->whereHas('user_schools', fn ($q) => $q->where('school_id', $request->integer('school_id'))))
            ->when($request->filled('search'), fn ($q) => $this->search($q, $request->input('search')))
            ->latest()
            ->get();

        return $this->ok($users->map(fn (User $u) => $this->payload($u))->values());
    }

    /** Name, email and phone only (no roles/schools): enough to pick a user for a school. */
    public function lookup(Request $request): JsonResponse
    {
        $request->validate(['q' => 'required|string|min:2']);

        $users = $this->search(User::query(), $request->input('q'))->orderBy('name')->limit(20)->get(['id', 'name', 'email', 'phone']);

        return $this->ok($users);
    }

    public function roles(): JsonResponse
    {
        return $this->ok(Role::orderBy('name')->pluck('name'));
    }

    public function store(Request $request, SaveUser $save): JsonResponse
    {
        $user = $save->create($request->validate(SaveUser::rules()));

        return $this->ok($this->payload($user->load(['roles', 'user_schools.school'])), status: 201);
    }

    public function update(Request $request, User $user, SaveUser $save): JsonResponse
    {
        $save->update($user, $request->validate(SaveUser::rules($user)));

        return $this->ok($this->payload($user->load(['roles', 'user_schools.school'])));
    }

    public function destroy(Request $request, User $user, DeleteUser $delete): JsonResponse
    {
        $delete($user, $request->user());

        return $this->ok(null);
    }

    private function search($query, string $text)
    {
        return $query->where(fn ($q) => $q->where('name', 'like', "%{$text}%")
            ->orWhere('email', 'like', "%{$text}%")
            ->orWhere('phone', 'like', "%{$text}%"));
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->roles->pluck('name')->first(),
            'two_factor_enabled' => $user->hasEnabledTwoFactorAuthentication(),
            'schools' => $user->user_schools->filter(fn ($us) => $us->school)->map(fn ($us) => ['id' => $us->school->id, 'name' => $us->school->name])->values(),
        ];
    }
}
