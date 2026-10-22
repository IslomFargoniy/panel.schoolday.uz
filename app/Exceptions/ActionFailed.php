<?php

namespace App\Exceptions;

use App\Support\UiText;
use RuntimeException;

/**
 * A business rule refused the action (branch limit reached, school still has data…).
 * [key] is a frontend translation key: the web panel flashes it, the API answers 422 with its text.
 */
class ActionFailed extends RuntimeException
{
    public function __construct(public readonly string $key, public readonly array $params = [])
    {
        parent::__construct(UiText::get($key, $params, 'uz'));
    }

    public function userMessage(): string
    {
        return UiText::get($this->key, $this->params);
    }
}
