<?php

namespace App\Actions;

use App\Exceptions\ActionFailed;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;

class DeleteRecord
{
    /**
     * Deletes the model; a foreign-key refusal (SQLSTATE 23000) becomes [relationsKey].
     */
    public static function run(Model $model, string $relationsKey): void
    {
        try {
            $model->delete();
        } catch (QueryException $e) {
            throw new ActionFailed($e->getCode() == 23000 ? $relationsKey : 'crud.error');
        }
    }
}
