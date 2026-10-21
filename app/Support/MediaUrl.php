<?php

namespace App\Support;

class MediaUrl
{
    /**
     * Absolute URL for a stored picture: "http..." is kept, "/storage/..." gets the host, a bare path is put under /storage.
     */
    public static function from(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return url(str_starts_with($path, '/') ? $path : '/storage/' . $path);
    }
}
