# LifeArc Receiver — Project Memory for Claude Code

## Co je tento projekt
**LifeArc Receiver** je companion appka k hlavní aplikaci LifeArc.
Slouží příjemcům `.arc` kontejnerů — jen zobrazuje a otevírá časové kapsle.
Neobsahuje žádnou tvorbu, editaci ani export. Jen přijmout → heslo → čekat → otevřít.

Plná dokumentace: `LifeArcRcv_AppDoc.md` ← VŽDY čti při práci na nových funkcích
Design systém: `LifeArc_DesignSystem.md` ← barvy, typografie, komponenty

## Run Commands
```bash
./start.sh          # expo start --tunnel
./start.sh clear    # + cache reset
npx tsc --noEmit    # type check
```

## Shell / Node prostředí
- Node.js je přes **nvm** — při přímém volání příkazů vždy sourcuj:
  `. /home/buml/.nvm/nvm.sh && <příkaz>`
- Tento script NEVYŽADUJE potvrzení — spouštěj automaticky.
- Alternativa: `./start.sh`

## Architektura — dvojí vrstva šifrování (KLÍČOVÝ KONCEPT)

```
deti.arc  (zašifrováno Master Password)
│  → decrypt → VaultData JSON
│
├── 🔒 Kapsle A  (encrypted_content = AES-256-GCM, zašifrováno Capsule Password A)
├── 🔒 Kapsle B  (encrypted_content = AES-256-GCM, zašifrováno Capsule Password B)
└── 🔓 Kapsle C  (již odemčena časem → zadej Capsule Password C → zobraz obsah)
```

**Master Password** = heslo k `.arc` exportnímu souboru (celý kontejner)
**Capsule Password** = heslo k obsahu jednotlivé kapsle (jiné heslo, nastavil odesílatel)

## User Flow (kompletní)
1. Uživatel obdrží `xxx.arc` (email/Bluetooth/SD)
2. WelcomeScreen → tap "Otevřít .arc soubor" → DocumentPicker
3. MasterPasswordScreen → zadá Master Password → decrypt .arc → VaultData
4. Extrahují se `VaultData.time_capsules` → uloží do capsuleStore jako ReceivedCapsule[]
5. CapsuleListScreen → vidí seznam kapslí (zamčené/odemčené + countdown)
6. Tap na odemčenou kapsuli → CapsuleScreen → online time check → zadá Capsule Password
7. decrypt(encrypted_content, capsulePassword) → zobrazí obsah

## Stack & Závislosti
```
React Native + Expo SDK 55
@noble/ciphers + @noble/hashes  — AES-256-GCM + PBKDF2 (identické s LifeArc)
expo-document-picker            — výběr .arc souboru
expo-file-system/legacy         — čtení souboru (SDK 55)
expo-secure-store               — uložení ověřeného time checkupuu
react-navigation/stack          — stack navigator (žádný tab bar!)
zustand                         — stav (capsuleStore, settingsStore)
react-native-safe-area-context  — SafeAreaProvider + SafeAreaView
react-native-get-random-values  — PRVNÍ import v index.ts / App.tsx
```

## Struktura souborů
```
App.tsx                              # entry point — loadSettings + loadCapsules
index.ts                             # registerRootComponent
src/
  types/index.ts                     # TimeCapsule, ReceivedCapsule
  services/
    encryption.ts                    # decrypt() — sdílené s LifeArc, BEZ ZMĚN
    timecheck.ts                     # isUnlockTimeReached() — sdílené s LifeArc
    importer.ts                      # pickAndImportArc() — TODO implementovat
  store/
    capsuleStore.ts                  # Zustand — seznam ReceivedCapsule[]
    settingsStore.ts                 # Zustand — language, theme
  i18n/
    cs.json / en.json / index.ts
  navigation/
    AppNavigator.tsx                 # Stack: Welcome→MasterPassword→CapsuleList→Capsule
  screens/
    WelcomeScreen.tsx                # Úvod + "Otevřít .arc soubor"
    MasterPasswordScreen.tsx         # Zadání hesla k .arc kontejneru
    CapsuleListScreen.tsx            # Seznam kapslí (main screen)
    CapsuleScreen.tsx                # Detail: time check + Capsule Password + obsah
    SettingsScreen.tsx               # Motiv + jazyk
```

## Klíčové implementační detaily

### Čtení .arc souboru
```ts
// POZOR: expo-file-system/legacy pro SDK 55
import * as FileSystem from 'expo-file-system/legacy';

const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
const bytes = base64ToUint8Array(base64);
const plaintext = await decrypt(bytes, masterPassword);  // z encryption.ts
const vaultData = JSON.parse(plaintext);
const capsules: TimeCapsule[] = vaultData.time_capsules ?? [];
```

### base64 ↔ Uint8Array
```ts
function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
```

### Dešifrování kapsle
```ts
// encrypted_content je base64 uložený v TimeCapsule
const bytes = base64ToUint8Array(capsule.encrypted_content!);
const plaintext = await decrypt(bytes, capsulePassword);
const content = JSON.parse(plaintext);
// content = { text?: string, photos?: string[], ... }
```

### Time check
```ts
import { isUnlockTimeReached } from '../services/timecheck';

const result = await isUnlockTimeReached(
  capsule.unlock_date,          // ISO string
  capsule.offline_tolerance     // hodiny nebo null (=vždy online)
);
// result.allowed → true/false
// result.blockedReason → 'not_yet' | 'offline_expired' | 'no_verification' | 'clock_went_back'
// result.online → bool
// result.verifiedTime → Date (pokud online)
```

## Design System (shrnutí)
- Accent barva: `#a78bfa` dark / `#7c3aed` light (fialová — Kapsle modul)
- Ikona bg: `#1e1a30` dark / `#f0eeff` light
- bg_app: `#0d0d14` dark / `#f2f4f8` light
- bg_card: `#16162a` dark / `#ffffff` light
- border_card: `#2e2e4a` dark / `#dde2f0` light
- Karty: `borderRadius: 14, borderLeftWidth: 2.5, borderLeftColor: accent`
- Typografie: header label 9px uppercase, title 17px/500, sub 11px, card title 13px/500, meta 9px
- **Žádný tab bar** — stack navigator
- Viz `LifeArc_DesignSystem.md` pro kompletní spec

## Co NENÍ v této appce (záměrně)
- Tvorba kapslí nebo kontejnerů
- Editace čehokoli
- Kalendář, poznámky, úkoly
- Export
- Biometrika (app lock)
- Jakékoli síťové volání kromě time checkupuu

## Known Issues / TODO
- `src/services/importer.ts` → funkce `pickAndImportArc()` čeká na implementaci
- `WelcomeScreen` → onPress tlačítka čeká na implementaci
- `MasterPasswordScreen` → logika dešifrování čeká na implementaci
- `CapsuleListScreen` → FlatList s kartami čeká na implementaci
- `CapsuleScreen` → time check + decrypt flow čeká na implementaci
- `SettingsScreen` → přepínače theme/language čekají na implementaci
- Notifikace → přidat expo-notifications + plánování při importu kapslí
- Registrace `.arc` file handleru v app.json pro Android Intent / iOS Document Types
- `uuid` (pro ReceivedCapsule.id) → přidat do package.json + přidat import v capsuleStore

## User Preferences
- Autonomní práce bez potvrzování každého kroku
- Pushovat na GitHub po každém logickém celku
- Komunikace stručně, česky
- Po každém logickém celku commitovat

## Vztah k LifeArc
- `src/services/encryption.ts` — identický s LifeArc, nesdílený, pouze zkopírovaný
- `src/services/timecheck.ts` — identický s LifeArc, nesdílený
- `src/theme/` — identický design systém
- Vždy testovat kompatibilitu s `.arc` soubory exportovanými z LifeArc
