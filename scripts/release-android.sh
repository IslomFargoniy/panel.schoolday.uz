#!/usr/bin/env bash
# ==============================================================================
# SchoolDay Android release
#   direct flavor -> signed APK (uz.schoolday.app.direct), uploaded as public/downloads/schoolday.apk
#                    on the server (installed APKs read version.json on start and update themselves)
#   play flavor   -> AAB for Google Play (uz.schoolday.app), copied to ~/Desktop/android-releases/
#
# Usage: scripts/release-android.sh [--no-upload] "What changed (shown in the update dialog)"
#   1. Bump versionCode/versionName in android/app/build.gradle.kts
#   2. Run this script (tests, builds, verifies the signature, uploads schoolday.apk, writes version.json)
#   3. Commit public/downloads/version.json and deploy
# --no-upload: build and write version.json only; the scp/chown commands are printed instead.
# ==============================================================================
set -euo pipefail

UPLOAD=1
if [ "${1:-}" = "--no-upload" ]; then
    UPLOAD=0
    shift
fi
NOTES="${1:-}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GRADLE="$ROOT/android/app/build.gradle.kts"
CODE="$(sed -nE 's/^[[:space:]]*versionCode = ([0-9]+).*/\1/p' "$GRADLE")"
NAME="$(sed -nE 's/^[[:space:]]*versionName = "([^"]+)".*/\1/p' "$GRADLE")"
OUT="$ROOT/public/downloads"
APK="$ROOT/android/app/build/outputs/apk/direct/release/schoolday-v$NAME-direct-release.apk"
AAB="$ROOT/android/app/build/outputs/bundle/playRelease/schoolday-v$NAME-play-release.aab"
RELEASES="$HOME/Desktop/android-releases"
SDK="$(sed -nE 's/^sdk.dir=(.*)/\1/p' "$ROOT/android/local.properties")"
APKSIGNER="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)/apksigner"

SERVER="root@193.180.213.188"
REMOTE_DIR="/var/www/panel_school_usr/data/www/panel.schoolday.uz/public/downloads"
REMOTE_APK="$REMOTE_DIR/schoolday.apk"
REMOTE_OWNER="panel_school_usr:panel_school_usr"

if [ ! -f "$ROOT/android/keystore.properties" ]; then
    echo "android/keystore.properties not found: the release signing key is required (android/README.md)." >&2
    exit 1
fi

# Published = the version.json in the last commit (it goes live with the deploy), so re-running the script is fine
PUBLISHED="$(git -C "$ROOT" show HEAD:public/downloads/version.json 2>/dev/null | sed -nE 's/.*"versionCode": *([0-9]+).*/\1/p' || true)"
if [ "${PUBLISHED:-0}" -ge "$CODE" ]; then
    echo "versionCode $CODE is not newer than the published ${PUBLISHED}. Bump it in android/app/build.gradle.kts." >&2
    exit 1
fi

echo "→ Building SchoolDay $NAME ($CODE): tests + assembleDirectRelease + bundlePlayRelease"
(cd "$ROOT/android" && ./gradlew -q :app:testDirectDebugUnitTest :app:assembleDirectRelease :app:bundlePlayRelease)
"$APKSIGNER" verify "$APK"

mkdir -p "$RELEASES"
cp "$APK" "$RELEASES/SchoolDay_v$NAME.apk"
cp "$AAB" "$RELEASES/SchoolDay_v$NAME.aab"
echo "✓ $RELEASES/SchoolDay_v$NAME.aab (Google Play) and SchoolDay_v$NAME.apk"
echo "  R8 mapping: android/app/build/outputs/mapping/playRelease/mapping.txt (Play Console → deobfuscation)"

if [ "$UPLOAD" = 1 ]; then
    echo "→ Uploading schoolday.apk to $SERVER"
    ssh "$SERVER" "mkdir -p $REMOTE_DIR && chown $REMOTE_OWNER $REMOTE_DIR && chmod 755 $REMOTE_DIR"
    scp "$APK" "$SERVER:$REMOTE_APK"
    ssh "$SERVER" "chown $REMOTE_OWNER $REMOTE_APK && chmod 644 $REMOTE_APK"
    echo "✓ https://panel.schoolday.uz/downloads/schoolday.apk"
else
    echo "Upload skipped. To publish the APK run:"
    echo "  ssh $SERVER \"mkdir -p $REMOTE_DIR && chown $REMOTE_OWNER $REMOTE_DIR && chmod 755 $REMOTE_DIR\""
    echo "  scp \"$APK\" $SERVER:$REMOTE_APK"
    echo "  ssh $SERVER \"chown $REMOTE_OWNER $REMOTE_APK && chmod 644 $REMOTE_APK\""
fi

# "version" and "apk" are kept for readers of the older {"version","apk"} shape
mkdir -p "$OUT"
php -r '
    [$code, $name, $notes, $file] = array_slice($argv, 1);
    $manifest = ["versionCode" => (int) $code, "versionName" => $name, "version" => $name, "apk" => "schoolday.apk", "notes" => $notes === "" ? null : $notes];
    file_put_contents($file, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
' "$CODE" "$NAME" "$NOTES" "$OUT/version.json"

echo "✓ public/downloads/version.json ($NAME). Commit it, then deploy."
