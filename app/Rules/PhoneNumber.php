<?php

namespace App\Rules;

use App\Support\Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** A phone number in any common spelling ("+998 90 123 45 67", "901234567"…). */
class PhoneNumber implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value !== null && $value !== '' && ! Phone::isValid((string) $value)) {
            $fail(__('Telefon raqam noto‘g‘ri. Masalan: +998 90 123 45 67'));
        }
    }
}
