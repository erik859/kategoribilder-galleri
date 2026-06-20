# Kategoribilder-galleri — Projektkontext för Claude Code

## Snabbfakta

| | |
|---|---|
| **Vad** | Webbverktyg för att hantera/exportera produktkategoribilder till WooCommerce. Multi-projekt (en datafil per kund). |
| **Ägarskap** | Hermodex-internt verktyg · kundprojekt **Cykelhuset** (`data-cykelvardag.json`, mot cykelvardag.se). |
| **Stack** | Vite 5 + React 18 + Zustand + @dnd-kit (ren JS). Ingen backend (GitHub API + localStorage). |
| **Port** | **8002** – låst i `vite.config.js` (`server`/`preview` + `strictPort`), Hermodex portregister. Full dev-URL: `http://localhost:8002/kategoribilder-galleri/`. |
| **Dev / Bygg / Test** | `npm run dev` · `npm run build` · `npm test` (vitest) / `npm run test:e2e` (playwright). |
| **Git** | `erik859/kategoribilder-galleri` (GitHub Template). Deploy: push `main` → GitHub Actions → Pages. |
| **Fallgropar** | Datafiler MÅSTE ligga i `public/`. Checka ALDRIG in `node_modules/`. Läsning same-origin; token behövs bara för att spara. |

## Vad är detta?

Ett webbaserat verktyg för att hantera kategoribilder i en cykelwebshop. Används av Erik (erik859) och Johannes för att tilldela, organisera och exportera produktkategoribilder som sedan används i WooCommerce.

Hostat på GitHub Pages: **https://erik859.github.io/kategoribilder-galleri/**

## Teknisk arkitektur

- **React 18 + Vite 5** — modulär app med build-steg (migrerad från tidigare single-file HTML/JS)
- **Zustand** för global state (`src/store.js`)
- **@dnd-kit** (core/sortable/modifiers/utilities) för drag & drop
- **GitHub Pages** för hosting — byggs och deployas automatiskt av `.github/workflows/deploy.yml` vid varje push till `main`
- **Multi-projekt:** flera kunder/datafiler i samma repo, valbara via en projektväljare (se nedan)
- **GitHub API** för att läsa/skriva datafiler (läsning sker same-origin utan token, sparning kräver PAT-token per användare)
- **localStorage** används som cache/backup (nycklar: `kbg_projects`, `kbg_current_project`, `kbg_state_<projektId>`, `gh_owner`, `gh_token`)

> Den gamla single-file-versionen finns kvar som `KATEGO~1.HTM.html` (~2 MB) men används inte längre av appen.

## ⚠️ Viktigast att veta (lätt att missa)

1. **Datafiler MÅSTE ligga i `public/`.** Vite kopierar bara `public/` till bygget (`dist/`). Datafiler i repo-roten deployas ALDRIG och ger 404 på Pages. Alla datafiler ligger därför i `public/` (`public/data.json`, `public/projects.json`, `public/data-<kund>.json`).
2. **Checka ALDRIG in `node_modules/`.** Den är gitignorerad. Tidigare incheckning av `node_modules` med Windows-binärer (esbuild/rollup) kraschade Linux-CI:t och bröt deployen i ~1 vecka. Om `git status` visar node_modules: stoppa.
3. **Läsning är same-origin, inte hårdkodad Pages-URL.** `loadJson` hämtar `${import.meta.env.BASE_URL}<file>` → funkar både lokalt (Vite serverar `public/`) och live (Pages serverar `dist/`), utan token. Token behövs bara för att SPARA.

## Multi-projekt (kunder)

Varje kund = ett **projekt** med en egen datafil i samma repo.

- **Register:** `public/projects.json` — en lista `[{ id, name, file }]`. Appen läser den vid start; saknas den faller den tillbaka till bara `Standard`.
- **Datafil per projekt:** `public/data.json` (Standard), `public/data-<kund>.json` (övriga).
- **Väljare i UI:** `src/components/ProjectSelector.jsx` (📁 längst upp) — byt / skapa (＋ Nytt) / döp om (✎) / ta bort (🗑). `Standard` kan inte tas bort.
- **Isolerad data:** varje projekt har egen localStorage-cache (`kbg_state_<id>`) och egen undo-historik. Aktivt projekt sparas i `kbg_current_project`.
- **Skriv-väg:** `github.js` skriver till `public/<file>` via Contents API (konstant `PUBLIC_DIR`). Att skapa/spara projekt kräver token; utan token funkar allt i läsläge lokalt.

Befintliga projekt: **Standard** (`data.json`) och **Cykelhuset** (`data-cykelvardag.json`, initierad som kopia av Standard, ska anpassas mot cykelvardag.se:s kategorier).

## Filer & struktur

| Sökväg | Beskrivning |
|--------|-------------|
| `index.html` | Vite-entry — laddar bara `src/main.jsx` |
| `src/main.jsx` | React-rot, monterar `<App>` |
| `src/App.jsx` | Layout, statistik, vy-flikar, kortkommandon (Ctrl+Z/Y), kör `init()` på mount |
| `src/store.js` | All state + mutationer (Zustand): gallery/woo/mapping, undo/redo, **projekt-hantering**, GitHub-synk |
| `src/index.css` | All styling |
| `src/components/ProjectSelector.jsx` | Projektväljare (byt/skapa/döp om/ta bort) |
| `src/components/Toolbar.jsx` | Verktygsrad (filter, lägg till sektion, synk-status, Återställ m.m.) |
| `src/components/GalleryView.jsx` | Gallerivy — sektioner med bildkort |
| `src/components/WebshopView.jsx` | Webshop-vy — redigerbar WooCommerce-hierarki (3 nivåer) |
| `src/components/Card.jsx` | Enskilt bildkort |
| `src/components/DragHint.jsx` | Hjälptext vid drag & drop |
| `src/components/modals/` | `GithubSetupModal`, `ImageModal`, `MoveModal`, `CsvExportModal` |
| `src/utils/github.js` | `loadJson`/`saveJson`/`getSha` (generiska), `loadData`/`saveData`, `verifyToken`. Läser same-origin, skriver till `public/` |
| `src/utils/helpers.js` | Hjälpfunktioner (`catToFilename`, `buildWooTree` m.fl.) |
| `public/data.json` | Standard-projektets data (~3.6 MB pga base64-bilder) |
| `public/data-cykelvardag.json` | Cykelhuset-projektets data |
| `public/projects.json` | Projektregister |
| `vite.config.js` | `base: '/kategoribilder-galleri/'` (viktigt för Pages) |
| `.gitignore` | Ignorerar `node_modules/`, `dist/` m.m. |
| `.claude/launch.json` | Dev-server-config för Claude Preview (port 8002) |
| `.github/workflows/deploy.yml` | Bygger (`npm run build`) och deployar `dist/` till Pages vid push till `main` |

## Datastruktur (per projektfil)

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
  "mapping": [ { "bidex_name": "...", "wc_cat_name_1": "...", "wc_cat_name_2": "...", "wc_cat_name_3": "..." } ]
}
```

`woo` = WooCommerce-hierarki som rader `[L1, L2, L3]`. `buildWooTree(woo)` bygger trädet `{ L1: { L2: [L3...] } }`.

## Köra & bygga lokalt

Kräver **Node.js** (LTS). Scripts i `package.json`:

```bash
npm install      # installera beroenden (en gång)
npm run dev      # dev-server med hot reload → http://localhost:8002/kategoribilder-galleri/
npm run build    # produktionsbygge till dist/ (kopierar public/ → dist/)
npm run preview  # förhandsgranska byggd version
npm test         # vitest
npm run test:e2e # playwright
```

OBS: appen ligger på bas-sökvägen `/kategoribilder-galleri/` — gå till den fulla URL:en, inte bara `localhost:8002/`. Utan GitHub-token visas allt i skrivskyddat läge (data läses ändå same-origin).

## Deploy

Push till `main` → GitHub Actions kör `npm install` + `npm run build` och publicerar `dist/` till Pages. Live-sajten uppdateras några minuter efter push.

**Verifiera deployen** (utan inloggad `gh`) via publika API:t:
`https://api.github.com/repos/erik859/kategoribilder-galleri/actions/runs` → kolla `conclusion` på senaste run. Bekräfta sedan att `…/public`-filerna är live, t.ex. `curl -I https://erik859.github.io/kategoribilder-galleri/projects.json`.

## Viktig state & actions (src/store.js)

```javascript
gallery, woo, mapping        // aktivt projekts data
projects, currentProjectId   // projektregister + aktivt projekt
dataSha, projectsSha         // SHA:er för GitHub-sparning
undoStack / redoStack        // Ångra/Gör om (max 20 steg, MAX_UNDO)
ghOwner / ghToken            // GitHub-credentials (från localStorage)
curView                      // 'gallery' | 'webshop' | 'export'

init()                       // laddar register + aktivt projekt (körs på mount)
loadFromGitHub() / saveState()
switchProject(id) / addProject(name) / renameProject(id,name) / deleteProject(id) / resetProject()
```

## Funktioner (implementerade)

- ✅ Multi-projekt: separata kunder/datafiler i samma repo, projektväljare
- ✅ Gallerivy med bildkort per kategori
- ✅ Webshop-vy med redigerbar WooCommerce-hierarki (3 nivåer)
- ✅ Drag & drop (bilder på kort, sektioner, L2 mellan L1, L3-sortering) via @dnd-kit
- ✅ Flytta bilder mellan kategorier (ersätt/infoga)
- ✅ Inline redigering av kategori/sektionsnamn
- ✅ CSV-export med urval + BIDEX/DST/WOO-kolumner
- ✅ Ångra/Gör om (Ctrl+Z / Ctrl+Y, 20 steg, per projekt)
- ✅ GitHub-synk (läs utan token, spara kräver PAT)
- ✅ Auto-namngivning av bilder efter kategorinamn
- ✅ Huvud-kort alltid först i varje sektion

## Kända problem / teknisk skuld

### 🔴 data.json är stor (base64-bilder)
- Varje projektfil är ~3.6 MB pga base64-kodade bilder i `manualUrl`.
- Lösning: migrera bilder till extern lagring (Google Drive/CDN), behåll bara `drive_id`/URL. Skulle reducera filerna drastiskt.

### 🟡 Dubbel `seoAlt`-nyckel i ImageModal.jsx
- Objektliteral med `seoAlt` definierad två gånger (~rad 32–34) → fallback-värdet används aldrig. Ger build-varning. Ta bort den överflödiga raden.

### 🟡 npm-sårbarheter
- `npm audit` rapporterar några sårbarheter i dev-beroenden — inget akut för en intern app.

## GitHub-token hantering

Token anges via ⚙-knappen (`GithubSetupModal`). Owner + token sparas i localStorage. Läsning sker same-origin (ingen token). Sparning sker via Contents API (`PUT public/<file>`) och kräver PAT med `repo`-scope. Tokens återkallas automatiskt om de hamnar i commits — skapa ny på github.com/settings/tokens/new.

## CSV-exportkolumner

`id, bidex_name, bidex_code, dst_name, dst_code, wc_cat_name_1, wc_cat_code_1, wc_cat_name_2, wc_cat_code_2, wc_cat_name_3, wc_cat_code_3, galleri_sektion, galleri_kategori, huvudkort, status, har_bild, drive_id, bildnamn`

## Lägga till ny kund (projekt)

Två sätt:
1. **I appen:** ⚙ ange token → ＋ Nytt → namn. Appen skapar `public/data-<id>.json`, lägger till i `projects.json` och byter dit.
2. **Manuellt:** skapa `public/data-<id>.json`, lägg till en rad i `public/projects.json`, committa + pusha.

## Nästa steg (rekommenderat)

1. **Anpassa Cykelhuset** mot cykelvardag.se:s kategoristruktur.
2. **Lös base64-problemet** (extern bildlagring).
3. **Testtäckning** för store-mutationer och projekt-hantering.
