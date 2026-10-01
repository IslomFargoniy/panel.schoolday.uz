<?php

function getFlattenedTranslationKeys(array $array, string $prefix = ''): array
{
    $keys = [];
    foreach ($array as $key => $value) {
        $fullKey = $prefix === '' ? (string) $key : "{$prefix}.{$key}";
        if (is_array($value)) {
            $keys = array_merge($keys, getFlattenedTranslationKeys($value, $fullKey));
        } else {
            $keys[] = $fullKey;
        }
    }

    return $keys;
}

test('all translation files exist and contain identical key structures', function () {
    $locales = ['uz', 'ru', 'en'];
    $parsed = [];
    $allKeys = [];

    foreach ($locales as $locale) {
        $filePath = public_path("locales/{$locale}/translation.json");
        expect(file_exists($filePath))->toBeTrue("Locale file for [{$locale}] does not exist at {$filePath}");

        $jsonContent = file_get_contents($filePath);
        $data = json_decode($jsonContent, true);
        expect(json_last_error())->toBe(JSON_ERROR_NONE, "Invalid JSON in {$filePath}: " . json_last_error_msg());
        expect($data)->toBeArray();

        $flattened = getFlattenedTranslationKeys($data);
        sort($flattened);
        $parsed[$locale] = $data;
        $allKeys[$locale] = $flattened;
    }

    $uzKeys = $allKeys['uz'];
    $ruKeys = $allKeys['ru'];
    $enKeys = $allKeys['en'];

    $missingInRu = array_diff($uzKeys, $ruKeys);
    $extraInRu = array_diff($ruKeys, $uzKeys);
    $missingInEn = array_diff($uzKeys, $enKeys);
    $extraInEn = array_diff($enKeys, $uzKeys);

    expect($missingInRu)->toBeEmpty('Keys present in uz but missing in ru: ' . implode(', ', $missingInRu));
    expect($extraInRu)->toBeEmpty('Keys present in ru but missing in uz: ' . implode(', ', $extraInRu));
    expect($missingInEn)->toBeEmpty('Keys present in uz but missing in en: ' . implode(', ', $missingInEn));
    expect($extraInEn)->toBeEmpty('Keys present in en but missing in uz: ' . implode(', ', $extraInEn));

    expect(count($uzKeys))->toBeGreaterThan(500);
});
