# LifeArc Receiver — i18n instrukce pro Claude Code

## Přehled systému

Překlad je řešen JSON soubory + custom hookem bez externích knihoven.

```
src/i18n/
  cs.json      ← primární jazyk (základ pravdy)
  en.json      ← anglický překlad (musí mít STEJNÉ klíče jako cs.json)
  index.ts     ← hook useTranslation()
```

`TranslationKeys` je automaticky odvozeno z `cs.json` (TypeScript `keyof typeof cs`).
Pokud klíč v `en.json` chybí, hook vrátí samotný klíč — viditelná chyba v UI.

---

## Hook useTranslation()

```ts
import { useTranslation } from '../i18n';

// Uvnitř React komponenty:
const { t, language } = useTranslation();

// Použití:
<Text>{t('capsule_locked')}</Text>

// language je 'cs' | 'en' — pro podmíněnou logiku mimo t()
```

**Mimo React komponentu** (services, store):
```ts
import { useSettingsStore } from '../store/settingsStore';
const language = useSettingsStore.getState().language;
```

---

## Pravidla při přidávání nové funkce

### 1. NIKDY nepiš hardcoded string do JSX/TSX

❌ Špatně:
```tsx
<Text>Nesprávné heslo</Text>
<Text>Delete capsule?</Text>
```

✅ Správně:
```tsx
<Text>{t('capsule_wrong_password')}</Text>
<Text>{t('capsule_delete_title')}</Text>
```

### 2. Vždy přidávej klíče do OBOU souborů najednou

Při každém novém textu:
1. Přidej klíč do `cs.json` (česky)
2. Přidej tentýž klíč do `en.json` (anglicky)
3. Nikdy nesynchronizovat "až pak" — vede k chybám v runtime

### 3. Konvence pojmenování klíčů

```
<screen>_<element>       → capsule_locked, welcome_open_arc
button_<akce>           → button_cancel, button_delete
error_<typ>             → error_empty_password, error_unknown
import_<výsledek>       → import_success, import_error_invalid
settings_<sekce>        → settings_language, settings_theme_dark
```

### 4. Parametrizované texty

Hook nepodporuje interpolaci nativně — řeš přes string replace:

```ts
// cs.json:
"capsule_offline_drift": "Offline odhad · {h} h od posledního ověření"

// en.json:
"capsule_offline_drift": "Offline estimate · {h} h since last check"

// Použití v komponentě:
t('capsule_offline_drift').replace('{h}', String(hoursElapsed))
```

### 5. Pluralizace

Pro plurály použij více klíčů:

```json
// cs.json — čeština má 3 tvary
"home_capsules_one":  "kapsle",
"home_capsules_many": "kapslí"

// en.json — angličtina má 2 tvary
"home_capsules_one":  "capsule",
"home_capsules_many": "capsules"
```

Logika v komponentě:
```ts
const label = count === 1 ? t('home_capsules_one') : t('home_capsules_many');
```

### 6. Datum a čas — lokalizace

Nepiš datum formáty hardcoded. Vždy použij `toLocaleString` s locale z `language`:

```ts
const { language } = useTranslation();
const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';

const dateStr = unlockDate.toLocaleString(locale, {
  day: 'numeric', month: 'long', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});
```

---

## Aktuální klíče — přehled skupin

| Prefix        | Počet klíčů | Popis                          |
|---------------|-------------|--------------------------------|
| `button_`     | 7           | Obecná tlačítka                |
| `welcome_`    | 3           | WelcomeScreen                  |
| `master_`     | 4           | MasterPasswordScreen           |
| `error_`      | 2           | Chybové hlášky                 |
| `home_`       | 7           | CapsuleListScreen              |
| `capsule_`    | 27          | CapsuleScreen + karty          |
| `import_`     | 3           | Import flow                    |
| `settings_`   | 9           | SettingsScreen                 |

Celkem: **~62 klíčů** v cs.json i en.json (musí se shodovat).

---

## Postup při audit hardcoded stringů

Před každým větším commitem spusť:

```bash
# Najdi hardcoded česky vypadající texty v TSX souborech
grep -rn "\"[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]" src/screens/ --include="*.tsx"

# Najdi hardcoded anglické texty (slova s mezerou uvnitř uvozovek)
grep -rn '" [a-z]' src/screens/ --include="*.tsx" | grep -v "//\|import\|style\|color\|font\|padding\|margin"
```

Každý nalezený hardcoded string přesuň do cs.json + en.json a nahraď `t('klíč')`.

---

## Přidání nového jazyka (do budoucna)

1. Zkopíruj `en.json` → `xx.json` (kód dle ISO 639-1)
2. V `index.ts` přidej import a záznam do `translations`
3. V `settingsStore.ts` rozšiř typ `language`
4. V `SettingsScreen` přidej tlačítko / položku

---

## Type safety

TypeScript hlídá klíče automaticky:

```ts
// index.ts
type TranslationKeys = keyof typeof cs;
const t = (key: TranslationKeys): string => ...
```

Pokud napíšeš `t('neexistujici_klic')`, TypeScript hodí error při `npx tsc --noEmit`.
Vždy spusť type check po přidání nových klíčů:

```bash
. /home/buml/.nvm/nvm.sh && npx tsc --noEmit
```
