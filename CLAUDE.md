# Kategoribilder-galleri — Projektkontext för Claude Code

## Vad är detta?

Ett webbaserat verktyg för att hantera kategoribilder i en cykelwebshop. Används av Erik (erik859) och Johannes för att tilldela, organisera och exportera produktkategoribilder som sedan används i WooCommerce.

Hostat på GitHub Pages: **https://erik859.github.io/kategoribilder-galleri/**

## Teknisk arkitektur

- **React 18 + Vite 5** — modulär app med build-steg (migrerad från tidigare single-file HTML/JS)
- **Zustand** för global state (`src/store.js`)
- **@dnd-kit** (core/sortable/modifiers/utilities) för drag & drop
- **GitHub Pages** för hosting — byggs och deployas automatiskt av `.github/workflows/deploy.yml` vid varje push till `main`
- **GitHub API** för att läsa/skriva `data.json` (läsning via Pages utan token, sparning kräver PAT-token per användare)
- **localStorage** används som backup/cache vid sidan av GitHub (nycklar: `kbg_state`, `gh_owner`, `gh_token`)

> Den gamla single-file-versionen finns kvar som `KATEGO~1.HTM.html` (~2 MB) men används inte längre av appen.

## Filer & struktur

| Sökväg | Beskrivning |
|--------|-------------|
| `index.html` | Vite-entry — laddar bara `src/main.jsx` |
| `src/main.jsx` | React-rot, monterar `<App>` |
| `src/App.jsx` | Layout, statistik, vy-flikar (galleri/webshop), kortkommandon (Ctrl+Z/Y) |
| `src/store.js` | All state + mutationer (Zustand): gallery/woo/mapping, undo/redo, GitHub-synk |
| `src/index.css` | All styling |
| `src/components/Toolbar.jsx` | Verktygsrad (filter, lägg till sektion, synk-status m.m.) |
| `src/components/GalleryView.jsx` | Gallerivy — sektioner med bildkort |
| `src/components/WebshopView.jsx` | Webshop-vy — redigerbar WooCommerce-hierarki (3 nivåer) |
| `src/components/Card.jsx` | Enskilt bildkort |
| `src/components/DragHint.jsx` | Hjälptext vid drag & drop |
| `src/components/modals/` | `GithubSetupModal`, `ImageModal`, `MoveModal`, `CsvExportModal` |
| `src/utils/github.js` | `loadData` / `saveData` / `verifyToken` mot GitHub Pages + API |
| `src/utils/helpers.js` | Hjälpfunktioner (t.ex. `catToFilename`) |
| `data.json` | All data: gallery + woo + mapping (~3.7 MB pga base64-bilder) |
| `vite.config.js` | Vite-config — `base: '/kategoribilder-galleri/'` (viktigt för Pages) |
| `package.json` | Beroenden + scripts |
| `.github/workflows/deploy.yml` | Bygger (`npm run build`) och deployar `dist/` till Pages vid push till `main` |
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

## Köra & bygga lokalt

Kräver **Node.js** (LTS). Scripts i `package.json`:

```bash
npm install      # installera beroenden (en gång)
npm run dev      # dev-server med hot reload → http://localhost:5173/kategoribilder-galleri/
npm run build    # produktionsbygge till dist/
npm run preview  # förhandsgranska byggd version
npm test         # vitest (enhetstester)
npm run test:e2e # playwright (e2e)
```

Utan GitHub-token visas galleriet i skrivskyddat läge (data hämtas från Pages/localStorage).

## Deploy

Push till `main` → GitHub Actions kör `npm install` + `npm run build` och publicerar `dist/` till GitHub Pages. Ingen manuell deploy behövs. Live-sajten uppdateras några minuter efter push.

## Viktig state (src/store.js)

```javascript
gallery   // Sektioner med kort (huvuddatan)
woo       // WooCommerce-hierarki [[l1, l2, l3], ...]
mapping   // BIDEX/DST-mappning från Excel
dataSha   // SHA för data.json (krävs vid GitHub-sparning)
undoStack / redoStack  // Ångra/Gör om (max 20 steg, MAX_UNDO)
ghOwner / ghToken      // GitHub-credentials (från localStorage)
curView   // 'gallery' | 'webshop' | 'export'
```

## Funktioner (implementerade)

- ✅ Gallerivy med bildkort per kategori
- ✅ Webshop-vy med redigerbar WooCommerce-hierarki (3 nivåer)
- ✅ Drag & drop bilder direkt på kort (@dnd-kit)
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

## Kända problem / teknisk skuld

### 🔴 Kritiskt: data.json är för stor
- Filen är ~3.7 MB pga base64-kodade bilder i `manualUrl`-fälten
- GitHub Pages kan trunkera/strula med så stora filer
- Lösning: migrera bilder till extern lagring (Google Drive/CDN), behåll bara `drive_id` eller URL i data.json. Skulle reducera data.json från 3.7 MB till ~50 KB.
- Workaround nu: localStorage används som backup

### 🟡 Merge-konflikter med data.json
- Eftersom data.json är stor och ändras ofta uppstår konflikter
- Lösning: ta alltid backup via `copy(localStorage.getItem('kbg_state'))` i browser-konsolen

### 🟡 npm-sårbarheter
- `npm audit` rapporterar några sårbarheter i dev-beroenden — inget akut för en intern app, men värt att se över vid tillfälle

## GitHub-token hantering

Varje användare anger sin token via ⚙-knappen i appen (`GithubSetupModal`). Owner + token sparas i localStorage (`gh_owner`, `gh_token`).

Läsning av `data.json` sker via Pages-URL:en (ingen token, ingen CORS). Sparning sker via GitHub Contents API (`PUT`) och kräver giltig PAT-token med skrivrättigheter.

Tokens kan bli återkallade om de hamnar i git-commits (GitHub scannar automatiskt). Om sparning slutar fungera: skapa ny token via github.com/settings/tokens/new.

## CSV-exportkolumner

`id, bidex_name, bidex_code, dst_name, dst_code, wc_cat_name_1, wc_cat_code_1, wc_cat_name_2, wc_cat_code_2, wc_cat_name_3, wc_cat_code_3, galleri_sektion, galleri_kategori, huvudkort, status, har_bild, drive_id, bildnamn`

## Nästa steg (rekommenderat)

1. **Lös base64-problemet** — konvertera alla `manualUrl` (base64) till Google Drive-uppladdningar eller extern lagring. Reducerar data.json drastiskt och tar bort den största källan till strul.
2. **Automatisk token-förnyelse** — bättre felhantering när token löper ut
3. **Testtäckning** — vitest/playwright är uppsatt; fyll på med tester för store-mutationer och drag & drop

## Onboarding av ny kund

1. github.com/erik859/kategoribilder-galleri → Use this template → Create new repo
2. Aktivera GitHub Pages: Settings → Pages → Source: GitHub Actions
3. Uppdatera `data.json` med kundens WooCommerce-kategorier och BIDEX-mappning
