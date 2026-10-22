<?php

namespace App\Actions\Users;

use App\Exceptions\ActionFailed;
use App\Models\User;

class DeleteUser
{
    public function __invoke(User $user, User $actor): void
    {
        if ($user->id === $actor->id) {
            throw new ActionFailed('crud.cannot_delete_self');
        }

        $user->tokens()->delete();
        $user->delete();
    }
}
