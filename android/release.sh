#!/bin/bash
# ============================================================
# SchoolDay Android — release (kept for habit; the real script is scripts/release-android.sh)
# ============================================================
#   ./release.sh "notes"            — tests + direct APK + Play AAB, version.json; no upload
#   ./release.sh --upload "notes"   — + uploads the APK as public/downloads/schoolday.apk on the server
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--upload" ]]; then
    shift
    exec ../scripts/release-android.sh "$@"
fi
exec ../scripts/release-android.sh --no-upload "$@"
