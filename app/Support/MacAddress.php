<?php

namespace App\Support;

/** MAC addresses are stored as "AA:BB:CC:DD:EE:FF", whatever separators were typed. */
class MacAddress
{
    public static function normalize(?string $value): ?string
    {
        $hex = strtoupper(preg_replace('/[^0-9A-Fa-f]/', '', (string) $value));

        return strlen($hex) === 12 ? implode(':', str_split($hex, 2)) : null;
    }

    /** Normalised, or the trimmed input when it isn't a MAC (validation then reports it). */
    public static function normalizeOrKeep(?string $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        return self::normalize($value) ?? $value;
    }

    public const REGEX = '/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/';
}
