#!/bin/bash
# ============================================================
# SchoolDay Android — release build
# ============================================================
#   ./release.sh            — APK + AAB yig'adi, APK'ni public/android ga qo'yadi
#   ./release.sh --upload   — + APK'ni serverga yuklaydi (public/android)
#
# Versiya: app/build.gradle.kts → versionCode (har Play yuklashda +1) va versionName.
# AAB (Play Market uchun): app/build/outputs/bundle/release/schoolday-v<versiya>-release.aab
# ============================================================
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
SERVER="root@193.180.213.188"
REMOTE_PATH="/var/www/panel_school_usr/data/www/panel.schoolday.uz"

if [[ ! -f keystore.properties ]]; then
    echo "keystore.properties topilmadi: release imzo kaliti kerak (README.md ga qarang)" >&2
    exit 1
fi

VERSION=$(grep -E '^\s*versionName\s*=' app/build.gradle.kts | sed -E 's/.*"(.*)".*/\1/')
CODE=$(grep -E '^\s*versionCode\s*=' app/build.gradle.kts | sed -E 's/[^0-9]//g')
echo "Versiya: $VERSION (code $CODE)"

./gradlew :app:testDebugUnitTest :app:assembleRelease :app:bundleRelease

APK="app/build/outputs/apk/release/schoolday-v$VERSION-release.apk"
AAB="app/build/outputs/bundle/release/schoolday-v$VERSION-release.aab"
mkdir -p "$ROOT/public/android"
cp "$APK" "$ROOT/public/android/schoolday-v$VERSION.apk"

echo ""
echo "APK: public/android/schoolday-v$VERSION.apk"
echo "AAB: android/$AAB  (Play Console'ga shu fayl yuklanadi)"
echo "R8 mapping: android/app/build/outputs/mapping/release/mapping.txt (Play Console → crash deobfuscation)"

if [[ "${1:-}" == "--upload" ]]; then
    ssh "$SERVER" "mkdir -p $REMOTE_PATH/public/android"
    scp "$ROOT/public/android/schoolday-v$VERSION.apk" "$SERVER:$REMOTE_PATH/public/android/"
    ssh "$SERVER" "chown -R panel_school_usr:panel_school_usr $REMOTE_PATH/public/android && chmod 755 $REMOTE_PATH/public/android && chmod 644 $REMOTE_PATH/public/android/*.apk"
    echo "Yuklandi: https://panel.schoolday.uz/android/schoolday-v$VERSION.apk"
fi
