<?php

namespace App\Support;

/**
 * One phone format for the whole system.
 *
 * Stored: E.164 — "+" and digits with the country code ("+998901234567").
 * Shown:  "+998 90 123 45 67" (other countries: "+" and groups of three).
 * Typed:  anything people write — "+998 (90) 123-45-67", "90 123 45 67", "998901234567".
 *         Nine bare digits are an Uzbek number without the code.
 */
class Phone
{
    public const UZ_CODE = '998';

    /** "+998901234567", or null when the value is not a phone number. */
    public static function normalize(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }
        // Only digits, spaces and the usual separators; letters mean it isn't a phone
        if (! preg_match('/^\+?[\d\s().\-]+$/', $value)) {
            return null;
        }

        $international = str_starts_with($value, '+');
        $digits = preg_replace('/\D/', '', $value);

        if (! $international && strlen($digits) === 9) {
            return '+' . self::UZ_CODE . $digits;
        }
        if (str_starts_with($digits, self::UZ_CODE)) {
            return strlen($digits) === 12 ? '+' . $digits : null;
        }

        // Other countries: E.164 allows up to 15 digits including the country code
        return strlen($digits) >= 10 && strlen($digits) <= 15 ? '+' . $digits : null;
    }

    public static function isValid(?string $value): bool
    {
        return self::normalize($value) !== null;
    }

    /** The normalised value, or the input unchanged when it can't be read (validation then reports it). */
    public static function normalizeOrKeep(mixed $value): mixed
    {
        if (! is_string($value) || trim($value) === '') {
            return $value === '' ? null : $value;
        }

        return self::normalize($value) ?? $value;
    }

    /** "+998901234567" → "+998 90 123 45 67"; unknown values are returned unchanged. */
    public static function format(?string $value): ?string
    {
        $normalized = self::normalize($value);
        if ($normalized === null) {
            return $value;
        }
        $digits = substr($normalized, 1);
        if (str_starts_with($digits, self::UZ_CODE)) {
            return sprintf('+998 %s %s %s %s', substr($digits, 3, 2), substr($digits, 5, 3), substr($digits, 8, 2), substr($digits, 10, 2));
        }

        return '+' . trim(chunk_split($digits, 3, ' '));
    }

    /**
     * Values a stored phone may have for what someone typed at login: the normal form plus the
     * older spellings saved before phones were normalised ("998…", "90…").
     *
     * @return list<string>
     */
    public static function candidates(string $value): array
    {
        $normalized = self::normalize($value);
        if ($normalized === null) {
            return [trim($value)];
        }
        $digits = substr($normalized, 1);
        $list = [$normalized, $digits, trim($value)];
        if (str_starts_with($digits, self::UZ_CODE)) {
            $list[] = substr($digits, 3);
        }

        return array_values(array_unique($list));
    }

    /** Digits to look for when a (partial) phone is typed into a search box: "90 123" → "90123". */
    public static function searchDigits(?string $search): ?string
    {
        $search = (string) $search;
        if (preg_match('/[^\d\s+().\-]/', $search)) {
            return null;
        }
        $digits = preg_replace('/\D/', '', $search);

        return strlen($digits) >= 3 ? $digits : null;
    }
}
