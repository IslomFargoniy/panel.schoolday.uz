<?php

use App\Models\User;

test('the panel shares the published android apk version for the sidebar download link', function () {
    $manifest = json_decode(file_get_contents(public_path('downloads/version.json')), true);

    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->where('androidApp.url', '/downloads/schoolday.apk')
            ->where('androidApp.version', $manifest['versionName']));
});

test('the published version.json keeps the fields the app and the panel read', function () {
    $manifest = json_decode(file_get_contents(public_path('downloads/version.json')), true);

    expect($manifest)->toHaveKeys(['versionCode', 'versionName', 'version', 'apk'])
        ->and($manifest['versionCode'])->toBeInt()
        ->and($manifest['version'])->toBe($manifest['versionName'])
        ->and($manifest['apk'])->toMatch('/^[A-Za-z0-9._-]+\.apk$/');
});
