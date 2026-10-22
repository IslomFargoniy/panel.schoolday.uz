<?php

namespace App\Actions\Users;

use App\Models\User;
use App\Rules\PhoneNumber;
use App\Support\Phone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SaveUser
{
    /** Normalises the phone before validation, so "90 123 45 67" and "+998901234567" are one number for "unique". */
    public static function prepare(Request $request): Request
    {
        if ($request->has('phone')) {
            $request->merge(['phone' => Phone::normalizeOrKeep($request->input('phone'))]);
        }

        return $request;
    }

    public static function rules(?User $user = null): array
    {
        $id = $user?->id;

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email' . ($id ? ",{$id}" : ''),
            'phone' => ['nullable', 'string', 'max:20', new PhoneNumber, 'unique:users,phone' . ($id ? ",{$id}" : '')],
            'password' => ($id ? 'nullable' : 'required') . '|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ];
    }

    public function create(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);
        $user->assignRole($data['role']);

        return $user;
    }

    /** An empty password keeps the current one. */
    public function update(User $user, array $data): User
    {
        $fields = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
        ];
        if (! empty($data['password'])) {
            $fields['password'] = Hash::make($data['password']);
        }

        $user->update($fields);
        $user->syncRoles([$data['role']]);

        return $user;
    }
}
