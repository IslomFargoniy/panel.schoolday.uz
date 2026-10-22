<?php

use App\Support\MacAddress;
use App\Support\Phone;

test('phones in any spelling become +998…', function (string $typed) {
    expect(Phone::normalize($typed))->toBe('+998901234567');
})->with(['+998 90 123 45 67', '+998 (90) 123-45-67', '998901234567', '901234567', '90 123 45 67', '+998901234567']);

test('foreign numbers keep their code', function () {
    expect(Phone::normalize('+7 916 123-45-67'))->toBe('+79161234567');
    expect(Phone::format('+79161234567'))->toBe('+791 612 345 67');
});

test('things that are not phones are rejected', function (?string $value) {
    expect(Phone::normalize($value))->toBeNull();
})->with(['', null, 'Farg\'ona', '12345', '+90123456', '99890123456']);

test('display format is easy to read', function () {
    expect(Phone::format('+998901234567'))->toBe('+998 90 123 45 67');
    expect(Phone::format('not a phone'))->toBe('not a phone');
});

test('login candidates include the old spellings', function () {
    expect(Phone::candidates('90 123 45 67'))->toContain('+998901234567', '998901234567', '901234567');
});

test('search digits ignore names', function () {
    expect(Phone::searchDigits('90 123'))->toBe('90123');
    expect(Phone::searchDigits('Ali'))->toBeNull();
    expect(Phone::searchDigits('12'))->toBeNull();
});

test('mac addresses get colons and capitals', function () {
    expect(MacAddress::normalize('88-de-39-32-d8-0f'))->toBe('88:DE:39:32:D8:0F');
    expect(MacAddress::normalize('88de3932d80f'))->toBe('88:DE:39:32:D8:0F');
    expect(MacAddress::normalize('88:de:39'))->toBeNull();
});
