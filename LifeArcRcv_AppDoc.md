# LifeArc Receiver — Aplikační dokumentace
> Verze: 1.0 | Stav: Pre-development  
> Určeno pro: Claude Code (implementační agent)  
> Vztah k hlavní appce: Samostatná companion appka ekosystému LifeArc

---

## 1. Co je LifeArc Receiver

LifeArc Receiver je **free, okleštěná companion appka** k hlavní aplikaci LifeArc. Slouží výhradně příjemcům šifrovaných `.arc` kontejnerů, kteří nepotřebují (nebo nechtějí) plnou funkčnost LifeArc.

**Typický use case:**
> Petr vytvoří v LifeArc kontejner `pro_dceru.arc`, naplní ho kapslemi s vzkazy a pošle ho dceři emailem spolu s Master Passwordem. Dcera nemá LifeArc — nainstaluje si zdarma LifeArc Receiver, otevře soubor, zadá heslo a čeká, až se kapsule v pravý čas odemknou.

---

## 2. Architektura ekosystému LifeArc

```
┌─────────────────────────────────────────────────────────┐
│                    ODESÍLATEL                           │
│              (má plnou LifeArc appku)                   │
│                                                         │
│  Vytvoří kontejner: deti.arc                            │
│  Obsah: Kalendář + Poznámky + Kapsule                   │
│  Zašifruje: AES-256-GCM, Master Password                │
│  Pošle: email / Bluetooth / flashka                     │
└────────────────────┬────────────────────────────────────┘
                     │  deti.arc + Master Password
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌─────────────────┐   ┌──────────────────────┐
│   LifeArc       │   │  LifeArc Receiver    │
│   (full appka)  │   │  (tato appka)        │
│                 │   │                      │
│ Vidí vše:       │   │ Vidí pouze:          │
│ ✓ Kalendář      │   │ ✓ Kapsule            │
│ ✓ Poznámky      │   │ ✗ Kalendář (skryto) │
│ ✓ Kapsule       │   │ ✗ Poznámky (skryto) │
│ ✓ TO-DO         │   │                      │
└─────────────────┘   └──────────────────────┘
```

---

## 3. Dvojí vrstva šifrování (klíčový koncept)

### Vrstva 1 — Kontejner (`.arc` soubor)
- Šifrován AES-256-GCM s **Master Password**
- Po zadání Master Password se kontejner otevře
- Příjemce vidí seznam kapslí — jejich názvy a data odemčení
- **Obsah kapslí je stále zamčený**

### Vrstva 2 — Kapsule (uvnitř kontejneru)
- Každá kapsule má vlastní **Capsule Password** a **datum odemčení**
- Před datem odemčení je kapsule zobrazena jako zamčená — viditelný název a countdown
- V den odemčení appka notifikuje příjemce
- Po zadání Capsule Password se zobrazí obsah (text, foto, audio)

```
deti.arc  (Master Password: "rodina2026")
│
├── 🔒 Vzkaz k 18. narozeninám    → odemkne se 15.6.2034  (Capsule Password: "...")
├── 🔒 Fotky z dětství             → odemkne se 1.1.2030   (Capsule Password: "...")
└── 🔓 Ahoj dcero!                 → již odemčena, zobrazit
```

---

## 4. Funkční rozsah appky

### Co Receiver UMÍ:
- Otevřít `.arc` soubor (z emailu, sdílení, Bluetooth, flashky, SD karty)
- Zadat Master Password a dešifrovat kontejner
- Zobrazit seznam kapslí se stavem (zamčená / odemčená)
- Zobrazit countdown do odemčení každé kapsule
- Naplánovat systémové notifikace pro každou kapsuli (offline, přežije restart)
- V den odemčení: vyžádat Capsule Password a zobrazit obsah
- Zobrazit obsah kapsule: text, fotografie, audio přehrávač

### Co Receiver NEUMÍ (záměrně):
- Vytvářet nové kontejnery nebo kapsule
- Editovat obsah
- Exportovat data
- Spravovat kalendář nebo poznámky
- Jakékoli cloudové připojení

---

## 5. Obrazovky appky

### 5.1 Úvodní obrazovka (Welcome)
- Logo LifeArc Receiver
- Tlačítko: **„Otevřít .arc soubor"** → spustí file picker / intent handler
- Text: „Obdrželi jste .arc soubor? Otevřete ho zde."
- Odkaz: „Co je LifeArc?" → odkaz na hlavní appku

### 5.2 Zadání Master Password
- Název souboru (např. `deti.arc`)
- Input: Master Password (s možností zobrazit/skrýt)
- Tlačítko: „Otevřít kontejner"
- Chybová hláška při nesprávném heslu

### 5.3 Seznam kapslí (hlavní obrazovka)
- Název kontejneru v headeru
- Seznam kapslí jako karty:
  - 🔒 Zamčená: název, datum odemčení, countdown (dny / hodiny)
  - 🔓 Odemčená: název, tlačítko „Zobrazit"
- Žádné další sekce (bez kalendáře, poznámek, nastavení)

### 5.4 Zadání Capsule Password
- Zobrazí se pouze pokud je kapsule odemčena (datum nastalo)
- Input: Capsule Password
- Tlačítko: „Otevřít kapsuli"

### 5.5 Obsah kapsule
- Název kapsule
- Datum vytvoření + datum odemčení
- Obsah dle typu:
  - **Text:** čitelný textový obsah
  - **Foto:** fullscreen prohlížeč fotografií
  - **Audio:** jednoduchý přehrávač
  - **Smíšený:** kombinace výše

---

## 6. Technické požadavky

### 6.1 Šifrování
Identické s hlavní LifeArc appkou — **sdílený decrypt engine**:

| Parametr | Hodnota |
|---|---|
| Algoritmus | AES-256-GCM |
| Klíč odvozen z | Master Password (Argon2 / PBKDF2) |
| Capsule Password | stejný princip, druhá vrstva |
| Kompatibilita | 100% s `.arc` soubory z LifeArc |

### 6.2 Notifikační systém
Identický s hlavní appkou:
- **Android:** `AlarmManager` + `BOOT_COMPLETED` receiver (přeplánuje po restartu)
- **iOS:** `UNUserNotificationCenter` + `UNCalendarNotificationTrigger`
- Appka při každém spuštění ověří a přeplánuje všechny budoucí notifikace
- Funguje offline, bez internetu, i po letech

### 6.3 Otevírání `.arc` souborů
- Registrace jako handler pro `.arc` příponu (Android Intent / iOS Document Types)
- Podpora: email příloha, Bluetooth, SD karta, flashka (OTG), AirDrop

### 6.4 Síť
- **Nulová** — žádné API volání, žádné servery, žádný cloud

### 6.5 Platforma
- Android + iOS
- React Native / Expo (stejná technologie jako hlavní LifeArc appka)

---

## 7. Design systém

Receiver používá **stejný design systém jako LifeArc** (viz `LifeArc_DesignSystem.md`):
- Dark theme jako výchozí, volitelný Light theme
- Akcentová barva kapslí: `#a78bfa` (dark) / `#7c3aed` (light) — fialová
- Levý barevný border na kartách kapslí: `borderLeftWidth: 2.5, borderLeftColor: accent`
- Stejná typografie, stejné komponenty karet

Rozdíl oproti hlavní appce:
- **Žádný tab bar** — appka má lineární flow (otevřít → heslo → seznam → kapsule)
- Jednodušší navigace: stack navigator, žádné tabyy
- Minimalistický header — jen logo LifeArc Receiver a název kontejneru

---

## 8. Monetizace a distribuce

- **Zdarma, bez reklam, bez in-app purchases**
- Cíl: snížit bariéru pro příjemce, kteří neznají LifeArc
- Sekundární efekt: příjemce zažije „wow moment" → zájem o plnou appku
- App Store + Google Play pod stejným vývojářským účtem jako LifeArc

---

## 9. Sdílené komponenty s LifeArc (doporučená struktura)

```
/shared
  /crypto
    decrypt.js          ← sdílený AES-256-GCM engine
    argon2.js           ← odvození klíče z hesla
  /components
    CapsuleCard.jsx     ← karta kapsule (zamčená / odemčená)
    ContentViewer.jsx   ← zobrazení textu, fotek, audia
    PasswordInput.jsx   ← input s show/hide hesla
  /notifications
    scheduler.js        ← plánování notifikací (Android + iOS)

/LifeArc              ← hlavní appka
/LifeArcRcv           ← tato appka (Receiver)
```

Decrypt engine a notifikační scheduler jsou **identické v obou appkách** — udržovat na jednom místě.

---

## 10. Uživatelský flow (kompletní)

```
1. Příjemce obdrží email s přílohami:
   - deti.arc
   - „Heslo ke kontejneru: rodina2026"

2. Klepne na přílohu deti.arc
   → systém nabídne otevřít v LifeArc Receiver
   → (nebo si appku nejdřív stáhne z App Store)

3. Obrazovka: Zadání Master Password
   → zadá „rodina2026" → kontejner se otevře

4. Obrazovka: Seznam kapslí
   → vidí např.:
      🔒 „Vzkaz k 18. narozeninám" — za 4 382 dní
      🔒 „Fotky z dětství" — za 1 095 dní
      🔓 „Ahoj dcero!" — ODEMČENA

5. Klepne na odemčenou kapsuli
   → zadá Capsule Password
   → zobrazí se obsah (text, fotky, audio)

6. Pro zamčené kapsule:
   → appka naplánuje notifikace na datum odemčení
   → v den D přijde notifikace: „Kapsule ‚Vzkaz k 18. narozeninám' je odemčena!"
   → příjemce otevře appku → zadá Capsule Password → zobrazí obsah
```
