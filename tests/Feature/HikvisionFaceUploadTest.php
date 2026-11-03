<?php

use App\Models\BranchDevice;
use App\Services\Hikvision\HikvisionSyncService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

function isapiReply(int $code, string $sub = 'ok'): array
{
    return ['success' => true, 'response' => json_encode(['statusCode' => $code, 'subStatusCode' => $sub])];
}

function callUploadFace(BranchDevice $device): bool
{
    $m = new ReflectionMethod(HikvisionSyncService::class, 'uploadFaceViaIsup');
    $m->setAccessible(true);

    return $m->invoke(new HikvisionSyncService(), $device, '7', HikvisionSyncService::faceUrl('faces/a.jpg'));
}

beforeEach(function () {
    Config::set('app.url', 'http://localhost');
    Config::set('hikvision.public_url', 'https://panel.schoolday.uz/');
    $this->device = new BranchDevice(['device_id' => 'branch1']);
});

test('face URL ignores APP_URL so the terminal can download it', function () {
    expect(HikvisionSyncService::faceUrl('/faces/a.jpg'))
        ->toBe('https://panel.schoolday.uz/storage/faces/a.jpg');
});

test('face upload succeeds on first POST', function () {
    Http::fake(['*/api/isapi' => Http::response(isapiReply(1))]);

    expect(callUploadFace($this->device))->toBeTrue();
    Http::assertSentCount(1);
});

test('face upload falls back to FDSetUp when POST is rejected', function () {
    Http::fake(['*/api/isapi' => Http::sequence()
        ->push(isapiReply(6, 'deviceUserAlreadyExistFace'))
        ->push(isapiReply(1))]);

    expect(callUploadFace($this->device))->toBeTrue();
    Http::assertSent(fn (Request $r) => $r['method'] === 'PUT' && str_contains($r['url'], 'FDSetUp'));
});

test('face upload reports failure when device cannot download the photo', function () {
    Http::fake(['*/api/isapi' => Http::response(isapiReply(6, 'urlDownloadFail'))]);

    expect(callUploadFace($this->device))->toBeFalse();
});
