# LifeArc Receiver — Aplikační dokumentace

> **Verze:** 1.0.0
> **Stav:** Implementováno (core flow funkční)
> **Stack:** React Native + Expo SDK 55, TypeScript
> **Poslední aktualizace:** 2026-03-15

---

## 1. Co je LifeArc Receiver

**LifeArc Receiver** je bezplatná companion appka k hlavní aplikaci LifeArc. Slouží výhradně **příjemcům** šifrovaných `.arc` kontejnerů — jen otevírá, dešifruje a zobrazuje časové kapsle. Nevytváří nic, neupravuje nic, neposílá nic nikam.

### Typický use case

> Petr vytvoří v LifeArc kontejner `pro_dceru.arc`, naplní ho zprávami a pošle ho dceři emailem spolu s Master Passwordem. Dcera nemá LifeArc — nainstaluje si LifeArc Receiver, otevře soubor, zadá heslo a čeká. V pravý čas ji appka upozorní. Zadá Capsule Password a přečte vzkaz.

### Co appka dělá (aktuálně implementováno)
- Výběr `.arc` souboru přes DocumentPicker (email, Bluetooth, SD karta, AirDrop)
- Dešifrování kontejneru pomocí Master Password (AES-256-GCM + PBKDF2)
- Trvalé uložení kapslí na zařízení (expo-file-system, plaintext JSON — obsah zůstává šifrovaný)
- Seznam kapslí s kartami: countdown, progress bar, locked/unlocked stav
- Online ověření času před odemčením (4 time servery paralelně, offline fallback)
- Zadání Capsule Password + dešifrování obsahu kapsle
- Zobrazení obsahu: text, placeholder pro foto a audio
- Dark / Light motiv, čeština / angličtina
- Nastavení (motiv + jazyk + info o appce)

### Co appka záměrně NEDĚLÁ
- Nevytváří kontejnery ani kapsle
- Neupravuje žádná data
- Neexportuje nic
- Nespravuje kalendář, poznámky, úkoly
- Neposílá žádná data na server (síť se používá jen pro ověření času)
- Neobsahuje biometriku ani app lock

---

## 2. Architektura ekosystému LifeArc

```
┌──────────────────────────────────────────────┐
│              ODESÍLATEL                       │
│         (má plnou LifeArc appku)              │
│                                               │
│  Vytvoří: deti.arc                            │
│  Zašifruje: AES-256-GCM, Master Password      │
│  Pošle: email / Bluetooth / flashka / AirDrop │
└───────────────────┬──────────────────────────┘
                    │  soubor.arc + Master Password
         ┌──────────┴──────────┐
         ▼                     ▼
┌────────────────┐   ┌─────────────────────┐
│   LifeArc      │   │  LifeArc Receiver   │
│   (full appka) │   │  (tato appka)       │
│                │   │                     │
│  ✓ Kalendář    │   │  ✓ Kapsule          │
│  ✓ Poznámky    │   │  ✗ Kalendář (skip)  │
│  ✓ Kapsule     │   │  ✗ Poznámky (skip)  │
│  ✓ TO-DO       │   │  ✗ TO-DO (skip)     │
│  ✓ Export      │   │                     │
└────────────────┘   └─────────────────────┘
```

---

## 3. Dvojí vrstva šifrování

Toto je klíčový koncept celého ekosystému LifeArc.

### Vrstva 1 — Kontejner (`.arc` soubor)

```
Formát: [16B salt][12B nonce][ciphertext + 16B GCM tag]
Algoritmus: AES-256-GCM
KDF: PBKDF2-SHA256, 100 000 iterací, 32B klíč
Heslo: Master Password (nastaví odesílatel při exportu)
```

Po správném Master Password → JSON struktura `VaultData`:
```json
{
  "meta": { "name": "deti", "created": "2026-01-01", "version": "1" },
  "time_capsules": [ ...TimeCapsule[] ],
  "calendar_events": [...],
  "notes": [...],
  "todos": [...]
}
```
Receiver extrahuje pouze `time_capsules`, ostatní ignoruje.

### Vrstva 2 — Obsah kapsule

```
encrypted_content: base64 string uložený v TimeCapsule
Formát po dekódování: [16B salt][12B nonce][ciphertext + 16B GCM tag]
Algoritmus: identický s vrstvou 1
Heslo: Capsule Password (jiné než Master Password, nastaví odesílatel)
```

Po správném Capsule Password → JSON obsah kapsule:
```json
{
  "text": "...",
  "photos": ["base64...", ...],
  "audio": "base64..."
}
```

### Schéma

```
deti.arc  ──[Master Password]──▶ VaultData
                                      │
                         time_capsules: [
                           { title, unlock_date, encrypted_content, ... },
                           ...
                         ]
                                      │
              každá kapsule ──[Capsule Password + datum]──▶ obsah
```

---

## 4. Navigační flow

Stack navigator bez tab baru. Navigace je lineární.

```
index.ts
  └── App.tsx  (loadSettings + loadCapsules při startu)
        └── AppNavigator.tsx  (Stack.Navigator)
              ├── WelcomeScreen          ← výchozí obrazovka
              ├── MasterPasswordScreen   ← params: { arcUri, fileName }
              ├── CapsuleListScreen      ← params: { containerName }
              ├── CapsuleScreen          ← params: { capsuleId }
              └── SettingsScreen
```

### RootStackParamList
```typescript
export type RootStackParamList = {
  Welcome: undefined;
  MasterPassword: { arcUri: string; fileName: string };
  CapsuleList: { containerName: string };
  Capsule: { capsuleId: string };
  Settings: undefined;
};
```

### Navigační přechody
1. `Welcome` → DocumentPicker → `MasterPassword` (`navigate`)
2. `MasterPassword` → decrypt OK → `CapsuleList` (`replace` — zabrání návratu zpět)
3. `CapsuleList` → tap odemčená kapsule → `Capsule` (`navigate`)
4. `CapsuleList` → tap ⚙️ → `Settings` (`navigate`)
5. `Welcome` → tap Nastavení → `Settings` (`navigate`)
6. `Welcome` → tap "Zobrazit uložené kapsle" → `CapsuleList` (`navigate`)

---

## 5. Struktura souborů

```
App.tsx                        # Entry point: loadSettings + loadCapsules
index.ts                       # registerRootComponent

src/
  types/
    index.ts                   # TimeCapsule, ReceivedCapsule

  services/
    encryption.ts              # encrypt() + decrypt() — AES-256-GCM + PBKDF2
    timecheck.ts               # isUnlockTimeReached() — online + offline fallback
    importer.ts                # pickArcFile() + decryptArcFile() + pickAndImportArc()

  store/
    capsuleStore.ts            # Zustand: ReceivedCapsule[], persist do JSON souboru
    settingsStore.ts           # Zustand: theme, language, persist do JSON souboru

  navigation/
    AppNavigator.tsx           # Stack navigator, RootStackParamList

  screens/
    WelcomeScreen.tsx          # Úvod + DocumentPicker
    MasterPasswordScreen.tsx   # Heslo k .arc kontejneru + decrypt
    CapsuleListScreen.tsx      # FlatList kapslí s kartami
    CapsuleScreen.tsx          # Time check + Capsule Password + obsah
    SettingsScreen.tsx         # Motiv + jazyk + o aplikaci

  i18n/
    cs.json                    # České texty
    en.json                    # Anglické texty
    index.ts                   # useTranslation() hook

  theme/
    index.ts                   # Barvy, typografie, spacing, radius, shadows
    commonStyles.ts            # Sdílené StyleSheet factory funkce
```

---

## 6. Datové typy

### TimeCapsule
```typescript
interface TimeCapsule {
  id: string;
  created_at?: string;          // ISO — datum vytvoření (může chybět)
  unlock_date: string;          // ISO — datum odemčení
  title: string;
  content_type: 'text' | 'audio' | 'photo' | 'mixed';
  content_ref: string;          // interní reference (nepoužívá se v RCV)
  encrypted: boolean;
  encrypted_content?: string;   // base64 AES-256-GCM blob
  notification_scheduled: boolean;
  offline_tolerance: number | null; // hodiny; null = vždy vyžaduj online
}
```

### ReceivedCapsule
```typescript
interface ReceivedCapsule {
  id: string;                   // UUID (expo-crypto.randomUUID)
  importedAt: string;           // ISO — kdy bylo importováno
  arcSourcePath?: string;       // cesta k .arc souboru v cache
  capsule: TimeCapsule;         // dekódovaná (ale NE dešifrovaná) kapsle
}
```

---

## 7. Služby (services)

### 7.1 encryption.ts

Čistě synchronní PBKDF2 + AES-256-GCM přes `@noble/ciphers` a `@noble/hashes`. Bez Web Crypto API — funguje v RN bez polyfillů.

```typescript
// Binární formát souboru / blob:
// [16B salt][12B nonce][ciphertext + 16B GCM auth tag]

decrypt(fileBytes: Uint8Array, password: string): Promise<string>
encrypt(data: string, password: string): Promise<Uint8Array>
```

Parametry:
- Salt: 16 bajtů náhodných dat
- Nonce: 12 bajtů náhodných dat
- Iterace PBKDF2: 100 000
- Délka klíče: 32 bajtů (AES-256)

Pokud heslo nesprávné → `cipher.decrypt()` vyhodí výjimku (GCM auth tag neplatí).

### 7.2 timecheck.ts

Ověřuje čas před odemčením kapsule — chrání před manipulací hodin.

```typescript
isUnlockTimeReached(
  unlockDateIso: string,
  offlineTolerance: number | null
): Promise<TimeCheckResult>
```

**Online flow** — paralelní dotaz na 4 time servery (první úspěšný vyhraje):
1. `worldtimeapi.org/api/ip`
2. `time.cloudflare.com/cdn-cgi/trace`
3. `www.google.com` (HEAD, čte `Date` header)
4. `timeapi.io/api/time/current/zone?timeZone=UTC`

Každý server má timeout 5 sekund. Online výsledek se uloží do `expo-secure-store` (klíč `lifearc_time_verification`).

**Offline fallback** (pokud `offlineTolerance !== null`):
```
systemElapsed = systemNow − storedSystemTime
if systemElapsed < 0 → "clock_went_back" (podezřelé)
if systemElapsed > tolerance → "offline_expired"
estimatedRealTime = storedServerTime + systemElapsed
```

**TimeCheckResult:**
```typescript
interface TimeCheckResult {
  allowed: boolean;
  online: boolean;
  source?: string;
  offlineFallback: boolean;
  offlineDriftHours?: number;
  verifiedTime?: Date;
  blockedReason?:
    | 'not_yet'           // čas ještě nenastal
    | 'offline_expired'   // offline příliš dlouho
    | 'no_verification'   // nikdy neproběhlo online ověření
    | 'clock_went_back';  // hodiny šly dozadu
}
```

### 7.3 importer.ts

```typescript
// Výběr souboru přes DocumentPicker
pickArcFile(): Promise<{ uri: string; fileName: string } | null>

// Dešifrování a extrakce kapslí
decryptArcFile(uri: string, exportPassword: string): Promise<ImportResult>

// Kombinace obou (pro případ, kdy se volá v jednom kroku)
pickAndImportArc(exportPassword: string): Promise<ImportResult>
```

**ImportResult:**
```typescript
interface ImportResult {
  success: boolean;
  capsules?: ReceivedCapsule[];
  error?: 'cancelled' | 'wrong_password' | 'no_capsules' | 'invalid';
}
```

**Postup `decryptArcFile`:**
1. `FileSystem.readAsStringAsync(uri, { encoding: 'base64' })`
2. `base64ToUint8Array(base64)` → `Uint8Array`
3. `decrypt(bytes, exportPassword)` → plaintext JSON string
4. `JSON.parse(plaintext).time_capsules` → `TimeCapsule[]`
5. Mapování na `ReceivedCapsule[]` s `Crypto.randomUUID()` jako ID

---

## 8. State management (Zustand)

### capsuleStore.ts

```typescript
interface CapsuleStoreState {
  capsules: ReceivedCapsule[];
  loaded: boolean;
  loadCapsules: () => Promise<void>;   // čte rcv_capsules.json
  addCapsule: (c: ReceivedCapsule) => void;
  removeCapsule: (id: string) => void;
}
```

Persistuje do: `{documentDirectory}/rcv_capsules.json`
Hesla se **nikdy** neukládají. `encrypted_content` zůstává šifrovaný.

### settingsStore.ts

```typescript
interface SettingsState {
  language: 'cs' | 'en';
  theme: 'light' | 'dark';
  setLanguage: (lang) => void;
  setTheme: (theme) => void;
  loadPersistedSettings: () => Promise<void>;
}
```

Persistuje do: `{documentDirectory}/lifearcrcv_settings.json`

---

## 9. Obrazovky

### WelcomeScreen

**Soubor:** `src/screens/WelcomeScreen.tsx`

Výchozí obrazovka stack navigatoru.

| Element | Popis |
|---|---|
| Ikona 🔒 | Ve čtvercovém boxu (88×88, borderRadius 24) |
| Nadpis | `t('app_name')` |
| Podtitulek | `t('app_subtitle')` |
| Popis | `t('welcome_desc')` |
| Tlačítko primární | `t('welcome_open_arc')` → `pickArcFile()` → navigate MasterPassword |
| Tlačítko ghost | Zobrazí se pokud `capsules.length > 0` → navigate CapsuleList |
| Odkaz | `t('settings_title')` → navigate Settings |

Po výběru souboru (`pickArcFile`) appka **naviguje na MasterPassword** s `{ arcUri, fileName }` — soubor se teprve dešifruje na další obrazovce.

---

### MasterPasswordScreen

**Soubor:** `src/screens/MasterPasswordScreen.tsx`
**Route params:** `{ arcUri: string, fileName: string }`

| Element | Popis |
|---|---|
| Název souboru | Z `route.params.fileName` (fialová barva) |
| Hint | `t('master_hint')` |
| Input | Heslo, secureTextEntry, 👁️ toggle |
| Tlačítko | `t('master_open_btn')` → `decryptArcFile(arcUri, password)` |
| Chyba | `import_error_invalid` / `import_error_no_capsules` / `error_unknown` |
| Loading | ActivityIndicator + `t('master_decrypting')` |

Po úspěšném dešifrování:
- `addCapsule(c)` pro každou kapsuli z výsledku
- `navigation.replace('CapsuleList', { containerName })` — replace (ne navigate) → zabrání návratu na heslo

---

### CapsuleListScreen

**Soubor:** `src/screens/CapsuleListScreen.tsx`
**Route params:** `{ containerName: string }`

FlatList kapslí z `useCapsuleStore`. Countdown se aktualizuje každou minutu (`setInterval` + `extraData={tick}`).

**Karta kapsule:**
| Element | Locked | Unlocked |
|---|---|---|
| Levý border | `#a78bfa` fialová | `#4ade80` zelená |
| Ikona | 🔒 na `#1e1a30` | 🔓 na `#1e1a30` |
| Status label | `t('capsule_locked')` | `t('capsule_unlocked')` |
| Countdown | `{n}d {n}h` / `{n}h {n}m` / `{n}m` | `t('capsule_unlocked_label')` |
| Progress bar | fialový fill, 3px | zelený fill, 3px |

**Progress bar výpočet:**
```typescript
start = created_at ?? importedAt
end   = unlock_date
progress = clamp((now - start) / (end - start), 0, 1)
```

**Interakce:**
- Tap na zamčenou → `Alert` s datem odemčení
- Tap na odemčenou → `navigate('Capsule', { capsuleId })`
- Long press → `Alert` smazat kapsuli
- Footer (pokud kapsule existují) → `+ Importovat další .arc` → navigate Welcome
- Footer (prázdný stav) → `Importovat .arc soubor` → navigate Welcome

---

### CapsuleScreen

**Soubor:** `src/screens/CapsuleScreen.tsx`
**Route params:** `{ capsuleId: string }`

Při mountu spustí `isUnlockTimeReached(unlock_date, offline_tolerance)`.

**Stavový automat:**

```
checkLoading = true
    │
    └─── isUnlockTimeReached() ───▶ checkLoading = false
                                         │
                        ┌────────────────┼────────────────┐
                        ▼                ▼                ▼
                   allowed=true     blocked              not found
                        │           (blockedReason)
                        ▼
               Capsule Password input
                        │
                   decrypt()
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
          content=null          content=CapsuleContent
          decryptError               │
                               zobraz obsah
```

**Stavy blokace (blocked):**
| blockedReason | Text | Barva |
|---|---|---|
| `not_yet` | `t('capsule_not_yet')` + countdown + datum | `#c0b0f0` |
| `offline_expired` | `t('capsule_offline_expired')` | `#fbbf24` |
| `no_verification` | `t('capsule_no_verification')` | `#fbbf24` |
| `clock_went_back` | `t('capsule_clock_back')` | `#ff4a4a` |

**Zobrazení obsahu po dešifrování:**
- `content.text` → `Text` komponenta
- `content.photos` → placeholder s počtem (fullscreen prohlížeč TODO)
- `content.audio` → placeholder (přehrávač TODO)
- Prázdný obsah → `t('capsule_no_text')`

---

### SettingsScreen

**Soubor:** `src/screens/SettingsScreen.tsx`

| Sekce | Obsah |
|---|---|
| **Motiv** | Segment buttons: `🌙 Tmavý` / `☀️ Světlý` (volá `setTheme`) |
| **Jazyk** | Segment buttons: `🇨🇿 Čeština` / `🇬🇧 English` (volá `setLanguage`) |
| **O aplikaci** | Název, `t('settings_about_desc')`, verze `1.0.0` |

Aktivní segment: `backgroundColor: #2e2840`, `borderColor: #a78bfa`, `color: #a78bfa`.

---

## 10. Lokalizace (i18n)

**Soubor:** `src/i18n/index.ts`

```typescript
function useTranslation(): { t: (key: TranslationKeys) => string; language: 'cs' | 'en' }
```

`TranslationKeys` = `keyof typeof cs` — TypeScript automaticky ověřuje existenci klíče.

Interpolace (`{h}`, `{n}`) se provádí ručně v komponentách:
```typescript
t('capsule_offline_drift').replace('{h}', hours.toFixed(1))
```

Jazykové soubory: `src/i18n/cs.json`, `src/i18n/en.json`
Klíčové skupiny klíčů: `app_*`, `btn_*`, `welcome_*`, `master_*`, `capsule_*`, `import_*`, `settings_*`, `error_*`, `home_*`

---

## 11. Design systém

### Barvy (aktuální tokeny)
| Token | Dark | Light | Použití |
|---|---|---|---|
| `bg_app` | `#0d0d14` | `#f2f4f8` | Pozadí obrazovky |
| `bg_card` | `#16162a` | `#ffffff` | Karta |
| `bg_elevated` | `#1e1e30` | `#f0f2f8` | Elevovaný povrch |
| `bg_icon` | `#1e1a30` | `#f0eeff` | Ikona kapsule |
| `border_card` | `#2e2e4a` | `#dde2f0` | Ohraničení |
| `text` | `#f0f0f0` | `#1a1a2e` | Hlavní text |
| `text_sub` | `#888888` | `#999999` | Sekundární |
| `text_meta` | `#555555` | `#bbbbbb` | Meta info |
| `accent` | `#a78bfa` | `#7c3aed` | Fialová — kapsule, tlačítka |
| `unlocked` | `#4ade80` | `#16a34a` | Zelená — odemčeno |
| `danger` | `#ff4a4a` | `#e53e3e` | Chyba, smazat |
| `warning` | `#fbbf24` | `#d97706` | Offline warning |

### Typografie
| Role | Velikost | Weight |
|---|---|---|
| Label (uppercase) | 9px | 600 |
| Meta, caption | 9–11px | 400 |
| Card title | 13px | 500 |
| Body | 14–15px | 400 |
| Screen title | 17–22px | 500–600 |
| Hero | 24px | 600 |

### Komponenty karet
```
borderRadius: 14
padding: 14–16
borderLeftWidth: 2.5
borderLeftColor: accent (locked) / unlocked (unlocked)
shadow: { shadowColor: #0d0d14, offset: 0/2, opacity: 0.07, radius: 8, elevation: 3 }
```

---

## 12. Závislosti (package.json)

| Balíček | Verze | Účel |
|---|---|---|
| `expo` | ~55.0.5 | SDK |
| `@noble/ciphers` | ^2.1.1 | AES-256-GCM |
| `@noble/hashes` | ^2.0.1 | PBKDF2-SHA256 |
| `expo-crypto` | ~55.0.9 | `randomUUID()` |
| `expo-document-picker` | ~55.0.8 | Výběr `.arc` souboru |
| `expo-file-system` | ~55.0.10 | Čtení souborů, persistance |
| `expo-secure-store` | ~55.0.8 | Uložení time verification |
| `zustand` | ^5.0.11 | State management |
| `@react-navigation/stack` | ^7.8.4 | Stack navigator |
| `react-native-get-random-values` | ~1.11.0 | Kryptografické náhodné bajty (polyfill) |
| `react-native-safe-area-context` | ^5.7.0 | SafeAreaView |
| `react-native-gesture-handler` | ^2.30.0 | Vyžadováno navigátorem |

### Důležité poznámky k závislostem
- `react-native-get-random-values` **musí být první import** v `index.ts` / `App.tsx`
- `expo-file-system/legacy` (subpath) se používá místo hlavního balíčku — Expo SDK 55 vyžaduje legacy API pro `readAsStringAsync` s base64
- `uuid` balíček **není** v projektu — UUID generuje `expo-crypto.randomUUID()`

---

## 13. Spouštění projektu

```bash
./start.sh          # expo start --tunnel
./start.sh clear    # expo start --tunnel + reset cache
npx tsc --noEmit    # type check (musí být 0 chyb)
```

Node.js přes nvm — při přímém spouštění vždy sourcovat:
```bash
. /home/buml/.nvm/nvm.sh && <příkaz>
```

---

## 14. TODO — nedokončené funkce

| Funkce | Soubor | Priorita |
|---|---|---|
| Notifikace (expo-notifications) | nový soubor `src/services/notifications.ts` | Střední |
| Registrace `.arc` file handleru | `app.json` (Android intent / iOS Document Types) | Střední |
| Fullscreen prohlížeč fotek | `CapsuleScreen.tsx` | Nízká |
| Audio přehrávač | `CapsuleScreen.tsx` | Nízká |
| Deduplicita při opakovaném importu stejného `.arc` | `importer.ts` | Nízká |
| Offline tolerance UI indikátor v CapsuleListScreen | `CapsuleListScreen.tsx` | Nízká |

### Notifikace — implementační poznámka
```typescript
// Při importu nových kapslí naplánovat:
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: { title: 'Kapsule odemčena', body: capsule.title },
  trigger: { date: new Date(capsule.unlock_date) },
});

// Přeplánovat při každém startu appky (App.tsx useEffect)
```

---

## 15. Kompatibilita s LifeArc

Receiver je 100% kompatibilní s `.arc` soubory exportovanými z hlavní LifeArc appky:
- Stejný encrypt/decrypt engine (`@noble/ciphers` + `@noble/hashes`)
- Stejné parametry: PBKDF2, 100k iterací, 32B klíč, 16B salt, 12B nonce
- Stejná struktura `VaultData.time_capsules`
- Stejná `TimeCapsule` interface
- Stejný `timecheck.ts` (kopie, ne sdílená)

Soubory `encryption.ts` a `timecheck.ts` jsou záměrně **zkopírovány** (ne sdíleny přes npm/monorepo) — appky jsou distribuovány samostatně.

---

## 16. Bezpečnostní principy

1. **Hesla se nikdy neukládají** — ani Master Password, ani Capsule Password
2. **`encrypted_content` zůstává šifrovaný** v capsuleStore (JSON na disku)
3. **Time verification** se ukládá do `expo-secure-store` (sandboxovaný keychain)
4. **Žádná síťová komunikace** kromě ověření času (4 veřejné time servery, HEAD/GET requesty)
5. **Offline manipulace hodin** je detekována: `clock_went_back` blokuje odemčení
6. **AES-256-GCM auth tag** zaručuje, že špatné heslo je okamžitě detekováno (bez brute-force leakage)

---

## 17. Beta distribuce — QR kód systém (2026-03-15)

Systém automatické aktualizace QR kódů pro beta testery na webu.

**Předávací adresář:** `/home/buml/QRs-html/`

| Soubor | Kdo aktualizuje |
|---|---|
| `versions.json` | LifeArc Claude Code agent |
| `versions-rcv.json` | LifeArcRcv Claude Code agent (tento agent) |
| `SPEC.md` | Smlouva pro HTML cron |

**Povinnost tohoto agenta:**
Po každém buildu / logickém celku zapsat do `/home/buml/QRs-html/versions-rcv.json`:
- `_updated` — aktuální ISO timestamp (VŽDY aktualizovat)
- `version` — z `app.json`
- `android_url` — URL APK na VPS (`srv1432682.hstgr.cloud/beta/LifeArcRcv-<verze>.apk`)
- `changelog` — stručný popis změn

Detailní instrukce: `/home/buml/QRs-html/qr-instruction-rcv.md`

**Workflow:**
1. Agent zapíše `versions-rcv.json` (pole `_updated` se změní)
2. HTML cron detekuje změnu → nasadí soubor na VPS
3. HTML stránka fetchuje JSON → generuje QR kódy (qrcode.js)
4. Beta tester naskenuje QR → stáhne APK

**Build příkaz (po nastavení EAS):**
```bash
. /home/buml/.nvm/nvm.sh
cd ~/LifeArcRcv && npx eas-cli build --platform android --profile preview
```
`eas.json`: `/home/buml/LifeArcRcv/eas.json`
