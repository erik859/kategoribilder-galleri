# Kategoribilder-galleri — Projektkontext för Claude Code

## Vad är detta?

Ett webbaserat verktyg för att hantera kategoribilder i en cykelwebshop. Används av Erik (erik859) och Johannes för att tilldela, organisera och exportera produktkategoribilder som sedan används i WooCommerce.

Hostat på GitHub Pages: **https://erik859.github.io/kategoribilder-galleri/**

## Teknisk arkitektur

- **Ren HTML/JS** — ingen build-process, inga beroenden
- **GitHub Pages** för hosting
- **GitHub API** för att läsa/skriva `data.json` (kräver PAT-token per användare)
- **localStorage** används som backup/cache vid sidan av GitHub

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `index.html` | Hela applikationen (~75KB) |
| `data.json` | All data: gallery + woo + mapping (~3.7MB pga base64-bilder) |
| `README.md` | Användardokumentation |
| `CLAUDE.md` | Denna fil |

## Datastruktur — data.json

```json
{
  "gallery": [
    {
      "section": "Drivlina",
      "cards": [
        {
          "type": "image",
          "cat": "Kassetter/Bakdrev",
          "fn": "kassetter-bakdrev.jpg",
          "drive_id": "1nL7fVV...",
          "manualUrl": "data:image/...base64...",
          "is_header": true,
          "seoAlt": "Kassetter/Bakdrev – Drivlina cykel",
          "fnCustom": false
        }
      ]
    }
  ],
  "woo": [["Cykeldelar", "Ram & Gaffel", "Kompletta ramar"], ...],
  "mapping": [
    {
      "bidex_name": "Complete Frames",
      "bidex_code": "201010",
      "dst_name": "Frame",
      "dst_code": "2O01",
      "wc_cat_name_1": "Cykeldelar",
      "wc_cat_code_1": "",
      "wc_cat_name_2": "Ram & Gaffel",
      "wc_cat_code_2": "",
      "wc_cat_name_3": "Kompletta ramar",
      "wc_cat_code_3": ""
    }
  ]
}
```

## Kända problem / teknisk skuld

### 🔴 Kritiskt: data.json är för stor
- Filen är ~3.7MB pga base64-kodade bilder i `manualUrl`-fälten
- GitHub Pages trunkerar filen när den serveras
- Lösning: migrera bilder till extern lagring (Google Drive/CDN), behåll bara drive_id eller URL i data.json
- Workaround nu: localStorage används som backup

### 🟡 Filen trunkeras vid skrivning
- Python/git verkar trunkera index.html vid ~72KB
- Lösning: alltid verifiera att `</html>` finns i slutet efter varje ändring
- Pattern att alltid köra: `python3 -c "with open('index.html') as f: html=f.read(); print(html.endswith('</html>'))"` 

### 🟡 Git lock-konflikter
- GitHub Desktop håller ofta `.git/index.lock` öppen
- Lösning: stäng GitHub Desktop innan git-kommandon
- Lock-filen ligger i `.git/index.lock` och kan tas bort manuellt

### 🟡 Merge-konflikter med data.json
- Eftersom data.json är stor och ändras ofta uppstår konflikter
- Lösning: ta alltid backup via `copy(localStorage.getItem('kbg_state'))` i browser console

## Funktioner (implementerade)

- ✅ Gallerivy med bildkort per kategori
- ✅ Webshop-vy med redigerbar WooCommerce-hierarki (3 nivåer)
- ✅ Drag & drop bilder direkt på kort
- ✅ Flytta bilder mellan kategorier (ersätt/infoga)
- ✅ Drag & drop för att flytta sektioner (gallerivy)
- ✅ Drag & drop för att flytta L2-kategorier mellan L1 i webshop-vy
- ✅ Drag & drop sortering av L3-kategorier i webshop-vy
- ✅ Inline redigering av kategori/sektionsnamn
- ✅ CSV-export med urval + BIDEX/DST/WOO-kolumner
- ✅ Ångra/Gör om (Ctrl+Z / Ctrl+Y, 20 steg)
- ✅ GitHub-synk (läs utan token, spara kräver PAT)
- ✅ Auto-namngivning av bilder efter kategorinamn
- ✅ Huvud-kort alltid först i varje sektion
- ✅ Template-stöd för onboarding av nya kunder

## GitHub-token hantering

Varje användare anger sin token via ⚙-knappen i appen. Token sparas i localStorage.

Tokens kan bli återkallade om de hamnar i git-commits (GitHub scannar automatiskt). Erik's nuvarande token är utgången — ny token behövs via github.com/settings/tokens/new.

## CSV-exportkolumner

`id, bidex_name, bidex_code, dst_name, dst_code, wc_cat_name_1, wc_cat_code_1, wc_cat_name_2, wc_cat_code_2, wc_cat_name_3, wc_cat_code_3, galleri_sektion, galleri_kategori, huvudkort, status, har_bild, drive_id, bildnamn`

## Viktiga variabler i index.html

```javascript
var D = [];          // Gallery-data (sektioner med kort)
var WOO = [];        // WooCommerce-hierarki [l1, l2, l3]
var MAPPING = [];    // BIDEX/DST-mappning från Excel
var GH = { owner, repo, file, token };  // GitHub-config
var _undoStack = []; // Ångra-stack (max 20 steg)
```

## Nästa steg (rekommenderat)

1. **Lös base64-problemet** — konvertera alla `manualUrl` (base64) till Google Drive-uppladdningar eller extern lagring. Reducerar data.json från 3.7MB till ~50KB.
2. **React-migrering** — när basen är stabil, överväg React + dnd-kit för bättre drag & drop och underhållbarhet
3. **Automatisk token-förnyelse** — bättre felhantering när token löper ut

## Hur man testar lokalt

Öppna `index.html` direkt i Chrome (file://). Utan GitHub-token visas galleriet i skrivskyddat läge från localStorage.

## Onboarding av ny kund

1. github.com/erik859/kategoribilder-galleri → Use this template → Create new repo
2. Aktivera GitHub Pages: Settings → Pages → Branch: main
3. Uppdatera `data.json` med kundens WooCommerce-kategorier och BIDEX-mappning
