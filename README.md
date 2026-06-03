# Kategoribilder — Galleri

Verktyg för att hantera och uppdatera kategoribilder för cykeldelar. Visar alla kategorier uppdelade i sektioner, med stöd för att lägga till, byta ut och organisera bilder.

## Länk

**[https://erik859.github.io/kategoribilder-galleri/](https://erik859.github.io/kategoribilder-galleri/)**

## Funktioner

- Visa alla kategorier och sektioner i ett bildgalleri
- Lägg till bilder via drag & drop, lokal fil eller URL
- Flytta bilder mellan kategorier (ersätt eller infoga)
- Webshop-vy med WooCommerce-hierarki (3 nivåer)
- Filtrera på kategorier som saknar bild
- Hoppa till sektion via dropdown
- Exportera lista som CSV
- Synkronisera ändringar med GitHub så flera användare kan jobba i samma galleri

## Komma igång

### 1. Öppna galleriet

Öppna länken i Chrome:  
**[https://erik859.github.io/kategoribilder-galleri/](https://erik859.github.io/kategoribilder-galleri/)**

### 2. Anslut till GitHub

Klicka på **⚙ GitHub** i verktygsfältet och ange din Personal Access Token (PAT).

Skapa en token på: [github.com/settings/tokens/new](https://github.com/settings/tokens/new)  
Välj **Tokens (classic)**, kryssa i **repo**, klicka **Generate token**.

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
4. Klicka **🔄 Hämta senaste** för att se Eriks senaste ändringar

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `index.html` | Applikationen |
| `data.json` | Galleriedata (kategorier och bilder) |

## Samarbete

Varje användare skapar sin egen GitHub-token och anger den via ⚙-knappen. Ändringar sparas automatiskt till `data.json` i repot och syns för alla direkt efter att de klickat **🔄 Hämta senaste**.
