# LifeArc Receiver — Podklady pro HTML agenta

> **Tento dokument slouží výhradně Claude Code agentovi pro tvorbu HTML stránek.**
> Obsahuje vše potřebné: popis projektu, obsah, design systém, strukturu stránek, kopie textů.
> Při práci nevyžaduj žádné další zdroje — vše je zde.

---

## 1. Co je LifeArc Receiver

**LifeArc Receiver** je bezplatná mobilní appka pro příjemce šifrovaných časových kapslí.

Funguje jako companion k hlavní aplikaci **LifeArc** — full-featured appce pro tvorbu digitálního odkazu. Zatímco LifeArc umožňuje vytvářet a spravovat kapsle, Receiver slouží čistě k jejich otevírání.

### Stručný příběh produktu
Petr vytvoří v LifeArc kontejner `pro_dceru.arc` — naplní ho zprávami, fotkami a vzkazem k 18. narozeninám. Soubor pošle dceři emailem spolu s heslem. Dcera nemá LifeArc. Stáhne si LifeArc Receiver — zdarma, bez registrace — otevře soubor a čeká. V pravý čas ji appka upozorní. Teprve tehdy zadá heslo ke kapsli a přečte vzkaz.

### Klíčové vlastnosti
- **Zdarma**, bez reklam, bez registrace, bez cloudu
- Otevírá `.arc` kontejnery (email, Bluetooth, SD karta, AirDrop)
- Dvojí šifrování: AES-256-GCM — Master Password + Capsule Password
- Systémové notifikace v den odemčení (fungují offline, i po restartu telefonu)
- Čeká roky, pokud je potřeba
- Dark / Light motiv, čeština + angličtina
- Android + iOS

### Co appka záměrně NEUMÍ
Nevytváří kapsle. Neupravuje data. Neposílá nic nikam. Nespravuje kalendář ani poznámky. Žádné API, žádný server, žádný cloud.

---

## 2. Dvojí vrstva šifrování (klíčový koncept pro webaře)

Toto je hlavní „wow" feature — musí být vysvětlena na webu jasně:

```
.arc soubor  ──────── Master Password ────────▶  Seznam kapslí (jen názvy a data)
                                                        │
                                             každá kapsule je zamčena zvlášť
                                                        │
                                       Capsule Password + datum odemčení
                                                        │
                                                   Obsah kapsule
                                              (text / fotky / audio)
```

**Master Password** = heslo k celému souboru. Příjemce ho dostane od odesílatele.
**Capsule Password** = heslo k obsahu konkrétní kapsule. Odesílatel ho dá příjemci, ale lze ho doručit i až v den odemčení (přes třetí osobu, dopis, etc.).

Datum odemčení hlídá appka — bez internetu (offline, ověřuje systémový čas a několik time serverů jako fallback).

---

## 3. Uživatelský flow (pro sekci „Jak to funguje")

### Krok 1 — Příjemce obdrží soubor
Email / Bluetooth / flashka / AirDrop → soubor `jmeno.arc` + heslo ke kontejneru.

### Krok 2 — Otevře soubor
Klepne na přílohu → systém nabídne otevřít v LifeArc Receiver. Nebo ho najde v souborech a otevře ručně.

### Krok 3 — Zadá Master Password
Appka dešifruje kontejner. Zobrazí se seznam kapslí — jen názvy a data, obsah je stále zamčený.

### Krok 4 — Čeká
Zamčené kapsle ukazují countdown. Appka naplánuje notifikace. Příjemce zavře appku a čeká dny, měsíce, roky.

### Krok 5 — V den odemčení
Přijde notifikace: „Kapsle ‚Vzkaz k 18. narozeninám' je odemčena!" Příjemce otevře appku, zadá Capsule Password a přečte obsah.

---

## 4. Obrazovky appky (pro mockupy a screenshoty)

### Screen 1 — Welcome
- Tmavé pozadí `#0d0d14`
- Centrovaná fialová ikona 🔒 ve čtvercovém boxu (bg `#1e1a30`, borderRadius 24)
- Nadpis: **LifeArc Receiver** (24px, fontWeight 600, `#f0f0f0`)
- Podtitulek: **Přijímač časových kapslí** (13px, `#888888`)
- Popis: *Obdrželi jste .arc soubor? Otevřete ho zde.* (14px, `#666666`, centrováno)
- Tlačítko: **Otevřít .arc soubor** (full-width, bg `#a78bfa`, borderRadius 12, text bílý)
- Pod tlačítkem odkaz: **Nastavení** (13px, `#555555`)

### Screen 2 — Master Password
- Label: `LIFEARC RCV` (9px, uppercase, letter-spacing, `#888`)
- Nadpis: **Master Password** (22px)
- Název souboru: `deti.arc` (13px, fialová `#a78bfa`)
- Hint: *Heslo k .arc kontejneru (nastavil odesílatel)* (12px, `#666`)
- Input s heslem: border `#2e2e4a`, bg `#16162a`, 👁️ toggle
- Tlačítko: **Otevřít kontejner** (fialová)
- Chybová hláška červenou `#ff4a4a`: *Nesprávné heslo nebo poškozený soubor*

### Screen 3 — Seznam kapslí
- Header: label `LIFEARC RCV`, nadpis kontejneru `deti`, sub `3 kapslí`, ⚙️ vpravo
- Karta zamčené kapsule:
  - Levý border 2.5px fialový `#a78bfa`
  - Ikona 🔒 v boxu `#1e1a30` (36×36, borderRadius 10)
  - Název kapsule (13px/500)
  - Status `ZAMČENO` (9px uppercase, fialová)
  - Datum: *Otevře se: 15. čvn 2034* (9px, `#555`)
  - Countdown vpravo: `4 382 d 14 h` (11px, `#888`)
  - Progress bar 3px dole (fialový fill na tmavém tracku)
- Karta odemčené kapsule: stejná struktura, zelená `#4ade80`, ikona 🔓
- Footer tlačítko: `+ Importovat další .arc`

### Screen 4 — Zadání Capsule Password (kapsle odemčena)
- Ikona 🔓 velká
- Zelený nadpis: **Čas nastal!**
- Subtext: *Zadej heslo ke kapsli*
- Input + tlačítko: **Otevřít kapsuli** (fialová)
- Chyba: *Nesprávné heslo nebo poškozená kapsle*

### Screen 5 — Zamčená kapsule (detail)
- Ikona 🔒 velká (48px)
- Fialový text: **Ještě není čas**
- Šedý countdown: `Za 4 382 dní 14 hodin`
- Malý text s datem odemčení

### Screen 6 — Obsah kapsule
- Label: `OBSAH KAPSLE`
- Nadpis kapsule
- Zelený řádek: *Odemčeno 15. června 2034 12:00*
- Textový obsah kapsule (15px, lineHeight 24, `#d0d0e8`)
- Footer: červené `Smazat kapsli`

### Screen 7 — Nastavení
- Sekce **Motiv**: segment buttons `🌙 Tmavý` / `☀️ Světlý`
- Sekce **Jazyk**: segment buttons `🇨🇿 Čeština` / `🇬🇧 English`
- Sekce **O aplikaci**: název, popis, verze

---

## 5. Design systém — barvy

### Hlavní paleta (Dark theme — výchozí)
| Token | HEX | Použití |
|---|---|---|
| `bg_app` | `#0d0d14` | Pozadí obrazovky |
| `bg_card` | `#16162a` | Pozadí karet |
| `bg_elevated` | `#1e1e30` | Elevovaný povrch |
| `bg_icon` | `#1e1a30` | Pozadí ikon kapslí |
| `border_card` | `#2e2e4a` | Ohraničení karet, inputů |
| `text_primary` | `#f0f0f0` | Hlavní text |
| `text_secondary` | `#888888` | Sekundární text, labely |
| `text_disabled` | `#555555` | Zakázaný text, meta info |
| `accent` | `#a78bfa` | Fialová — kapsle, tlačítka, accent border |
| `accent_dark` | `#7c3aed` | Tmavší fialová (pro stíny) |
| `unlocked` | `#4ade80` | Zelená — odemčená kapsule |
| `danger` | `#ff4a4a` | Chyba, smazat |
| `warning` | `#fbbf24` | Varování (offline) |

### Hlavní paleta (Light theme)
| Token | HEX | Použití |
|---|---|---|
| `bg_app` | `#f2f4f8` | Pozadí obrazovky |
| `bg_card` | `#ffffff` | Pozadí karet |
| `bg_icon` | `#f0eeff` | Pozadí ikon kapslí |
| `border_card` | `#dde2f0` | Ohraničení karet |
| `text_primary` | `#1a1a2e` | Hlavní text |
| `text_secondary` | `#999999` | Sekundární text |
| `accent` | `#7c3aed` | Fialová |
| `unlocked` | `#16a34a` | Zelená odemčena |

### Gradients (pro webové pozadí / hero sekce)
```css
/* Dark hero */
background: linear-gradient(135deg, #0d0d14 0%, #1e1a30 50%, #0d0d14 100%);

/* Accent glow efekt */
box-shadow: 0 0 60px rgba(167, 139, 250, 0.15);

/* Card hover */
box-shadow: 0 4px 24px rgba(124, 58, 237, 0.2);
```

---

## 6. Design systém — typografie

Doporučené webové fonty (v tomto pořadí preferencí):
1. **Inter** (Google Fonts) — primary
2. **-apple-system, BlinkMacSystemFont** — system fallback

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Typografická škála
| Role | Velikost | Weight | Použití |
|---|---|---|---|
| `hero` | 48–64px | 700 | Hero nadpis na webu |
| `h1` | 32px | 700 | Sekční nadpisy |
| `h2` | 24px | 600 | Nadpisy karet |
| `title` | 20px | 600 | Titulky v appce |
| `body_lg` | 17px | 400 | Větší tělo textu |
| `body` | 15px | 400 | Standardní tělo |
| `body_sm` | 13px | 400 | Malý text, popisky |
| `caption` | 11px | 400 | Meta info, datum |
| `label` | 9px | 600 | Uppercase labely (letter-spacing: 1px) |

---

## 7. Design systém — komponenty

### Karta kapsule (pro webový mockup)
```css
.capsule-card {
  background: #16162a;
  border-radius: 14px;
  padding: 14px;
  border-left: 2.5px solid #a78bfa;   /* fialová = zamčeno */
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
}
.capsule-card.unlocked {
  border-left-color: #4ade80;          /* zelená = odemčeno */
}
```

### Ikona kapsule (čtvercový box)
```css
.capsule-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #1e1a30;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
```

### Progress bar
```css
.progress-track {
  height: 3px;
  background: #2e2e4a;
  border-radius: 2px;
  margin-top: 10px;
}
.progress-fill {
  height: 3px;
  background: #a78bfa;
  border-radius: 2px;
}
```

### Primární tlačítko
```css
.btn-primary {
  background: #a78bfa;        /* dark */
  /* nebo #7c3aed light */
  border-radius: 12px;
  padding: 14px 32px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-primary:hover {
  background: #9370e8;
  transform: translateY(-1px);
}
```

### Ghost tlačítko
```css
.btn-ghost {
  border: 1.5px solid #a78bfa;
  border-radius: 12px;
  padding: 12px 32px;
  color: #a78bfa;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
}
```

### Segment přepínač (theme/language)
```css
.segment-btn {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  border: 1.5px solid #2e2e4a;
  color: #888;
  font-size: 13px;
  font-weight: 600;
}
.segment-btn.active {
  background: #2e2840;
  border-color: #a78bfa;
  color: #a78bfa;
}
```

---

## 8. Navrhované HTML stránky

### Stránka A — Landing page (index.html)
Hlavní marketingová stránka. Struktura:

1. **Hero sekce**
   - Tmavé pozadí s fialovým ambient glow
   - Velká ikona 🔒 + logo nápis „LifeArc Receiver"
   - Headline: *Zprávy přes čas. Přijmi, vyčkej, otevři.*
   - Subheadline: *Bezplatná appka pro příjemce šifrovaných časových kapslí.*
   - Dvě CTA tlačítka: [Stáhnout pro Android] [Stáhnout pro iOS]
   - Malá poznámka: *Zdarma · Bez registrace · Bez cloudu*

2. **Jak to funguje (3 kroky)**
   - Ikony s čísly, krátký popis každého kroku
   - Krok 1: Obdržíš `.arc` soubor → otevřeš v appce
   - Krok 2: Zadáš heslo → vidíš seznam kapslí s odpočty
   - Krok 3: V den odemčení → zadáš heslo ke kapsli → přečteš zprávu

3. **Funkce (features grid)**
   - 🔐 Dvojí šifrování AES-256-GCM
   - 🔔 Notifikace i roky dopředu
   - 📴 Funguje offline
   - 🌍 Čeština + angličtina
   - 🎨 Dark / Light motiv
   - 💸 Zdarma, bez reklam

4. **Mockup sekce**
   - Stylizovaný screenshot nebo wireframe telefonu se Screenem 3 (seznam kapslí)

5. **FAQ (3–5 otázek)**
   - Viz sekce 10 níže

6. **Download sekce**
   - Opakování CTA tlačítek
   - Odkaz na LifeArc (hlavní appka)

7. **Footer**
   - © LifeArc · Část ekosystému LifeArc · Privacy Policy

---

### Stránka B — Jak to funguje (how-it-works.html)
Detailní průvodce pro příjemce, kteří nevědí co dělat.

1. **Hero**: *Dostali jste .arc soubor? Tady je návod.*
2. **Sekce 1 — Co je .arc soubor**: popis formátu, bezpečnost
3. **Sekce 2 — Instalace appky**: odkaz App Store + Google Play
4. **Sekce 3 — Otevření souboru**: 5 kroků s ikonami
5. **Sekce 4 — Dvojí heslo**: vysvětlení Master Password vs Capsule Password
6. **Sekce 5 — Notifikace**: proč je zapnout, co se stane v den odemčení
7. **FAQ**: viz sekce 10

---

### Stránka C — Privacy Policy (privacy.html)
- Appka neshromažďuje žádná data
- Vše zůstává na zařízení
- Žádná síťová komunikace (kromě ověření času přes veřejné time servery)
- GDPR compliance

---

## 9. Texty (copywriting — připraveno k použití)

### Hero headliny (výběr)
- *Zprávy přes čas. Přijmi, vyčkej, otevři.*
- *Někdo pro tebe připravil kapsuli. Zde ji otevřeš.*
- *Šifrované vzkazky z minulosti. Bezpečně. Offline.*
- *Časová kapsule dorazila. Je čas ji otevřít?*

### Anglické varianty
- *Messages across time. Receive, wait, open.*
- *Someone sent you a time capsule. Open it here.*
- *Encrypted messages from the past. Safe. Offline.*

### Features — krátké popisky
| Feature | CS | EN |
|---|---|---|
| Dvojí šifrování | *Každá kapsule má vlastní heslo. Nikdo jiný ji neotevře.* | *Each capsule has its own password. No one else can open it.* |
| Offline notifikace | *Appka připomene v pravý čas — i bez internetu, i po restartu.* | *App reminds you at the right time — offline, even after restart.* |
| Žádný cloud | *Nic nikam neodesíláme. Vše zůstává na tvém telefonu.* | *We send nothing anywhere. Everything stays on your phone.* |
| Zdarma | *Bez registrace, bez reklam, bez skrytých poplatků.* | *No registration, no ads, no hidden fees.* |
| Čeká roky | *Kapsule odemčená za 10 let? Žádný problém.* | *Capsule unlocking in 10 years? No problem.* |

### Stažení / CTA texty
- *Stáhnout zdarma pro Android*
- *Stáhnout zdarma pro iOS*
- *Dostupné na Google Play*
- *Dostupné na App Store*
- *Chceš posílat kapsule? Vyzkoušej LifeArc →*

---

## 10. FAQ (připraveno k použití)

**Q: Co je .arc soubor?**
A: `.arc` je šifrovaný kontejner vytvořený aplikací LifeArc. Obsahuje časové kapsle — zprávy, fotky nebo nahrávky, které se odemknou v předem stanovený čas.

**Q: Potřebuji internetové připojení?**
A: Pouze pro ověření přesného času při odemykání kapsule. Pokud odesílatel nastavil offline toleranci, appka funguje i bez internetu.

**Q: Kde jsou moje data uložena?**
A: Výhradně v tvém telefonu. Appka neposílá nic nikam. Neexistuje žádný server, žádný cloud, žádná registrace.

**Q: Mám dvě hesla — co s nimi?**
A: **Master Password** otevře celý soubor a zobrazí seznam kapslí (ale ne jejich obsah). **Capsule Password** je heslo ke konkrétní kapsuli — odesílatel ti ho předá, až nastane správný čas.

**Q: Co když ztratím telefon?**
A: Importuj `.arc` soubor znovu do nové appky a zadej heslo. Soubor si uchovej v záloze (email, cloud, atd.).

**Q: Je appka opravdu zdarma?**
A: Ano. Bez reklam, bez in-app purchases, bez předplatného. LifeArc Receiver je bezplatná pro všechny příjemce.

**Q: Jak dostanu .arc soubor?**
A: Odesílatel ti ho pošle emailem, přes AirDrop, Bluetooth, SD kartu nebo USB flashku. Appka zvládne otevřít soubor z jakéhokoliv zdroje.

---

## 11. Vztah k hlavní appce LifeArc

LifeArc Receiver je součástí ekosystému **LifeArc** — appky pro tvorbu digitálního odkazu.

| | LifeArc | LifeArc Receiver |
|---|---|---|
| **Cena** | Placená / freemium | Zdarma |
| **Účel** | Tvorba kapslí, zápisník, kalendář | Pouze otevírání kapslí |
| **Pro koho** | Odesílatel | Příjemce |
| **Šifrování** | Tvoří i dešifruje | Pouze dešifruje |
| **Kompatibilita** | Exportuje `.arc` | Importuje `.arc` |

---

## 12. Technické poznámky pro webové stránky

### Favicon / App icon
- Barva: `#a78bfa` (fialová) na tmavém bg `#1e1a30`
- Emoji ikona: 🔒

### Open Graph meta tagy
```html
<meta property="og:title" content="LifeArc Receiver — Přijímač časových kapslí">
<meta property="og:description" content="Bezplatná appka pro otevírání šifrovaných .arc kontejnerů. Bez registrace, bez cloudu.">
<meta property="og:image" content="og-image.png">  <!-- tmavý banner s logem -->
<meta name="theme-color" content="#a78bfa">
```

### Doporučené fonty (Google Fonts import)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### CSS reset doporučení
```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #0d0d14;
  color: #f0f0f0;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

### Animace (doporučené, jemné)
```css
/* Glow pulse na hero ikoně */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 30px rgba(167,139,250,0.2); }
  50%       { box-shadow: 0 0 60px rgba(167,139,250,0.4); }
}

/* Fade-in při scrollu (použij Intersection Observer) */
.fade-in {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}
```

---

## 13. Celková estetika webu

- **Tón**: Záhadný, důvěryhodný, jemně emocionální. Ne korporátní, ne hravý.
- **Motiv**: Čas, vzpomínky, zprávy přes čas. Tma s fialovým světlem.
- **Vizuální styl**: Dark theme jako default. Hodně prázdného prostoru (whitespace). Jemné gradienty. Žádné agresivní animace.
- **Texty**: Krátké věty. Konkrétní. Bez marketingové omáčky.
- **Cílová skupina**: Technicky méně zdatní příjemci (ne vývojáři) — web musí být srozumitelný.

---

*Dokument vygenerován: 2026-03-15*
*Verze appky: 1.0.0*
*Stack: React Native + Expo SDK 55, AES-256-GCM, @noble/ciphers*
