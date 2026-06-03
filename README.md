# Kategoribilder — Galleri

Verktyg för att hantera och uppdatera kategoribilder för cykeldelar. Visar alla kategorier uppdelade i sektioner med stöd för att lägga till, byta ut och organisera bilder. Innehåller även en webshop-vy som speglar WooCommerce-hierarkin.

## Länk

**[https://erik859.github.io/kategoribilder-galleri/](https://erik859.github.io/kategoribilder-galleri/)**

## Funktioner

- Gallerivy med alla kategorier uppdelade i sektioner
- Webshop-vy med redigerbar WooCommerce-hierarki (3 nivåer)
- Lägg till bilder via drag & drop, lokal fil eller URL
- Flytta bilder mellan kategorier (ersätt eller infoga)
- Redigera kategori- och sektionsnamn direkt i gränssnittet
- Ändringar i webshop-vy synkar automatiskt till gallerivyn
- Filtrera på kategorier som saknar bild
- Hoppa till sektion via dropdown
- CSV-export med urval per kategori — inkluderar WooCommerce-sökväg (L1/L2/L3), status, Drive ID och bildnamn
- Automatisk synkronisering till GitHub så flera användare kan jobba i samma galleri

## Komma igång

### 1. Öppna galleriet

Öppna länken i Chrome:
**[https://erik859.github.io/kategoribilder-galleri/](https://erik859.github.io/kategoribilder-galleri/)**

Galleriet laddas utan inloggning i skrivskyddat läge.

### 2. Anslut till GitHub (för att spara ändringar)

Klicka på **⚙ GitHub** i verktygsfältet och ange din Personal Access Token (PAT).

Skapa en token på: [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
Välj **Tokens (classic)** och kryssa i **repo**.

Tokens sparas bara lokalt i din webbläsare — aldrig på servern.

### 3. Redigera

Ändringar sparas automatiskt till GitHub. Statusen syns i verktygsfältet:

- ✓ Synkad — allt är sparat
- 💾 Sparar... — pågår
- ✗ Fel — något gick fel, försök igen

Klicka **🔄 Hämta senaste** för att ladda in ändringar som någon annan har gjort.

## För Johannes

1. Öppna **[https://erik859.github.io/kategoribilder-galleri/](https://erik859.github.io/kategoribilder-galleri/)** i Chrome
2. Skapa en egen token på [github.com/settings/tokens/new](https://github.com/settings/tokens/new) — välj **Tokens (classic)**, kryssa i **repo**
3. Klicka **⚙ GitHub** i galleriet och klistra in tokenen → Spara
4. Klicka **🔄 Hämta senaste** för att se senaste ändringar

## CSV-export

Klicka **⬇ CSV** i verktygsfältet. En modal öppnas där du väljer vilka kategorier som ska inkluderas.

Kolumner i exporten:
- Woo L1 (Huvudkategori) — t.ex. Cykeldelar, Tillbehör
- Woo L2 (Underkategori) — t.ex. Drivlina, Bromsar
- Woo L3 (Kategori) — t.ex. Kassetter/Bakdrev
- Galleri-sektion
- Galleri-kategori
- Huvudkort
- Status (Har bild / Saknar bild)
- Har bild (Ja/Nej)
- Drive ID
- Bildnamn

## Onboarda en ny kund

Det här repot är en GitHub Template. För varje ny kund skapar du en egen kopia:

1. Gå till [github.com/erik859/kategoribilder-galleri](https://github.com/erik859/kategoribilder-galleri)
2. Klicka **Use this template** → **Create a new repository**
3. Namnge repot, t.ex. `kategoribilder-cykelexperten`
4. Aktivera GitHub Pages: Settings → Pages → Branch: main → Save
5. Redigera `data.json` med kundens egna WooCommerce-kategorier och galleridata
6. Kunden får sin egen URL: `https://DITTNAMN.github.io/kategoribilder-cykelexperten/`

Varje kund har sin helt egna app, egna data och egna kategorier — helt isolerat från de andra.

Gör repot till template: Settings → kryssa i **Template repository** → Save.

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `index.html` | Applikationen |
| `data.json` | Galleridata + WooCommerce-hierarki |

## Teknisk info

- All data lagras i `data.json` som ett JSON-objekt med `gallery` (gallerikortkort) och `woo` (WooCommerce-hierarki)
- Inga externa tjänster eller backend behövs — allt körs i webbläsaren
- Bilder lagras antingen som Google Drive-ID eller base64 direkt i data.json
