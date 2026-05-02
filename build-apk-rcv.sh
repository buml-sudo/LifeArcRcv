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

APK_SRC="android/app/build/outputs/apk/release/app-release.apk"

echo "=== LifeArc Receiver APK Build ==="
[ -n "$CHANGELOG" ] && echo "  Changelog: $CHANGELOG"

# 0. Git pull
echo ""
echo "[0/4] Git pull..."
git pull
echo "✓ Kód aktuální"

# Verze z app.json (po git pull — může být aktualizovaná)
VERSION=$(python3 -c "import json; print(json.load(open('app.json'))['expo']['version'])")
APK_NAME="LifeArcRcv-${VERSION}.apk"
echo "  Verze: ${VERSION}"

# 1. npm install (zajistí aktuální závislosti po git pull)
echo ""
echo "[1/5] npm install..."
npm install --legacy-peer-deps
echo "✓ Závislosti aktuální"

# 2. Expo prebuild (synchronizuje android/ s app.json)
echo ""
echo "[2/5] Expo prebuild..."
npx expo prebuild --platform android --clean --no-install
echo "✓ android/ aktualizován"

# 3. Build
echo ""
echo "[3/5] Builduju APK..."
cd android && ./gradlew assembleRelease --quiet && cd ..
echo "✓ APK sestaven: $APK_SRC"

# 4. Deploy na VPS
echo ""
echo "[4/5] Nahrávám na VPS..."
ssh ${VPS_SSH} "mkdir -p ${VPS_BETA}"
scp "${APK_SRC}" "${VPS_SSH}:${VPS_BETA}/${APK_NAME}"
ssh ${VPS_SSH} "cp ${VPS_BETA}/${APK_NAME} ${VPS_BETA}/LifeArcRcv-latest.apk"
echo "✓ Nahráno: https://${VPS_HOST}/beta/${APK_NAME}"

# 5. Aktualizuj versions-rcv.json (VPS + lokálně)
echo ""
echo "[5/5] Aktualizuji versions-rcv.json..."
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
