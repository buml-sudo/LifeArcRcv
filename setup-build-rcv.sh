#!/bin/bash
# LifeArc Receiver — jednorázový setup pro lokální Android build
# Spusť JEDNOU na svém notebooku: ./setup-build.sh

set -e
echo "=== LifeArc Receiver Build Setup ==="

# 1. Java JDK 17
echo ""
echo "[1/4] Instaluji Java JDK 17..."
sudo apt-get update -q
sudo apt-get install -y openjdk-17-jdk
java -version

# 2. Node závislosti
echo ""
echo "[2/4] Instaluji npm závislosti..."
[ -f "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"
cd "$(dirname "$0")"
npm install

# 3. Expo prebuild — vygeneruje android/ adresář
echo ""
echo "[3/4] Spouštím expo prebuild (generuje android/ adresář)..."
npx expo prebuild --platform android --clean

# 4. Android SDK command line tools
echo ""
echo "[4/4] Instaluji Android SDK..."
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME/cmdline-tools"

TMP=$(mktemp -d)
curl -sL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$TMP/tools.zip"
unzip -q "$TMP/tools.zip" -d "$TMP"
mv "$TMP/cmdline-tools" "$ANDROID_HOME/cmdline-tools/latest"
rm -rf "$TMP"

export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

yes | sdkmanager --licenses > /dev/null 2>&1
sdkmanager "platform-tools" "build-tools;36.0.0" "platforms;android-36"

grep -q "ANDROID_HOME" "$HOME/.bashrc" || cat >> "$HOME/.bashrc" <<'EOF'
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
EOF

echo "✓ Android SDK nainstalován: $ANDROID_HOME"
echo ""
echo "✓ Setup hotov! Teď builduj pomocí:"
echo "  ./build-apk.sh"
echo "  ./build-apk.sh \"Popis změn pro changelog\""
