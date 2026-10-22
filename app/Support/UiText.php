<?php

namespace App\Support;

use Illuminate\Support\Arr;

/**
 * Text from the frontend's public/locales/{uz,ru,en}/translation.json, so the API answers with the
 * same messages as the web panel ("crud.branch_limit_reached" → "...limiti (3 ta) tugagan.").
 */
class UiText
{
    private const LOCALES = ['uz', 'ru', 'en'];

    /** @var array<string, array> */
    private static array $cache = [];

    public static function get(string $key, array $params = [], ?string $locale = null): string
    {
        $locale = $locale ?? static::requestLocale();
        $text = Arr::get(static::load($locale), $key) ?? Arr::get(static::load('uz'), $key) ?? $key;

        foreach ($params as $name => $value) {
            $text = str_replace('{{' . $name . '}}', (string) $value, $text);
        }

        return is_string($text) ? $text : $key;
    }

    /** "ru-RU,ru;q=0.9" → "ru"; anything unknown → "uz". */
    public static function requestLocale(): string
    {
        $preferred = request()?->getPreferredLanguage(self::LOCALES);

        return in_array($preferred, self::LOCALES, true) ? $preferred : 'uz';
    }

    private static function load(string $locale): array
    {
        if (! isset(static::$cache[$locale])) {
            $path = public_path("locales/{$locale}/translation.json");
            static::$cache[$locale] = is_file($path) ? (json_decode(file_get_contents($path), true) ?: []) : [];
        }

        return static::$cache[$locale];
    }
}
