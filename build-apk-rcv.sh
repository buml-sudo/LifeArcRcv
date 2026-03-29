#!/bin/bash
# LifeArc Receiver — build APK + deploy na VPS
# Spouštěj na NOTEBOOKU po každém update: ./build-apk.sh
# Volitelný argument: popis změn pro changelog
#   ./build-apk.sh "Nová funkce XY, oprava bugu Z"

set -e

VPS_SSH="vps"   # alias z ~/.ssh/config (root@srv1432682.hstgr.cloud)
VPS_HOST="srv1432682.hstgr.cloud"
VPS_BETA="/var/www/html/beta"
VPS_QR="/home/buml/QRs-html/versions-rcv.json"
LOCAL_QR="$HOME/QRs-html/versions-rcv.json"

CHANGELOG="${1:-}"

[ -f "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Verze z app.json
VERSION=$(python3 -c "import json; print(json.load(open('app.json'))['expo']['version'])")
APK_NAME="LifeArcRcv-${VERSION}.apk"
APK_SRC="android/app/build/outputs/apk/release/app-release.apk"

echo "=== LifeArc Receiver APK Build v${VERSION} ==="
[ -n "$CHANGELOG" ] && echo "  Changelog: $CHANGELOG"

# 1. Expo prebuild (synchronizuje android/ s app.json)
echo ""
echo "[1/4] Expo prebuild..."
npx expo prebuild --platform android --clean --no-install
echo "✓ android/ aktualizován"

# 2. Build
echo ""
echo "[2/4] Builduju APK..."
cd android && ./gradlew assembleRelease --quiet && cd ..
echo "✓ APK sestaven: $APK_SRC"

# 3. Deploy na VPS
echo ""
echo "[3/4] Nahrávám na VPS..."
ssh ${VPS_SSH} "mkdir -p ${VPS_BETA}"
scp "${APK_SRC}" "${VPS_SSH}:${VPS_BETA}/${APK_NAME}"
ssh ${VPS_SSH} "cp ${VPS_BETA}/${APK_NAME} ${VPS_BETA}/LifeArcRcv-latest.apk"
echo "✓ Nahráno: https://${VPS_HOST}/beta/${APK_NAME}"

# 4. Aktualizuj versions-rcv.json (VPS + lokálně)
echo ""
echo "[4/4] Aktualizuji versions-rcv.json..."
TODAY=$(date +%Y-%m-%d)
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
URL="https://${VPS_HOST}/beta/${APK_NAME}"

# Pokud changelog nebyl zadán, použij generický text
if [ -z "$CHANGELOG" ]; then
  CHANGELOG="LifeArcRcv v${VERSION}"
fi

# Aktualizuj na VPS
ssh ${VPS_SSH} "python3 - <<'PYEOF'
import json
path = \"${VPS_QR}\"
try:
    with open(path) as f:
        d = json.load(f)
except FileNotFoundError:
    d = {}
d['_updated'] = '${TIMESTAMP}'
d['_note'] = 'Aktualizováno LifeArcRcv Claude Code agentem.'
d['lifearc_rcv'] = {
    'version': '${VERSION}',
    'updated': '${TODAY}',
    'android_url': '${URL}',
    'ios_url': None,
    'changelog': '${CHANGELOG}'
}
with open(path, 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
print('versions-rcv.json aktualizovan (VPS)')
PYEOF"

# Aktualizuj lokálně (pro HTML cron pokud běží lokálně)
if [ -f "$LOCAL_QR" ]; then
  python3 - <<PYEOF
import json
path = "$LOCAL_QR"
with open(path) as f:
    d = json.load(f)
d['_updated'] = '$TIMESTAMP'
d['_note'] = 'Aktualizováno LifeArcRcv Claude Code agentem.'
d['lifearc_rcv'] = {
    'version': '$VERSION',
    'updated': '$TODAY',
    'android_url': '$URL',
    'ios_url': None,
    'changelog': '$CHANGELOG'
}
with open(path, 'w') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
print('versions-rcv.json aktualizovan (lokálně)')
PYEOF
fi

echo ""
echo "=== Hotovo! ==="
echo "  APK:    https://${VPS_HOST}/beta/${APK_NAME}"
echo "  Latest: https://${VPS_HOST}/beta/LifeArcRcv-latest.apk"
echo "  QR kód na webu se automaticky aktualizuje"
