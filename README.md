[README.md](https://github.com/user-attachments/files/28434433/README.md)
# Kategoribilder — Galleri

Verktyg för att hantera och uppdatera kategoribilder för cykeldelar. Visar alla kategorier uppdelade i sektioner, med stöd för att lägga till, byta ut och organisera bilder.

## Funktioner

- Visa alla kategorier och sektioner i ett bildgalleri
- Lägg till bilder via drag & drop, lokal fil eller URL
- Redigera kategorinamn och sektionsnamn direkt i galleriet
- Filtrera på kategorier som saknar bild
- Hoppa till sektion via dropdown
- Exportera lista som CSV
- Synkronisera ändringar med GitHub så flera användare kan jobba i samma galleri

## Komma igång

### 1. Öppna galleriet

Öppna länken:  
`https://erik859.github.io/kategoribilder-galleri/kategoribilder-galleri_v2.html`

### 2. Anslut till GitHub

Klicka på **⚙ GitHub** i verktygsfältet och ange din Personal Access Token (PAT).

Skapa en token på: [github.com/settings/tokens/new](https://github.com/settings/tokens/new)  
Välj **Tokens (classic)** och kryssa i **repo**.

Tokens sparas bara lokalt i din webbläsare.

### 3. Redigera

Ändringar sparas automatiskt till GitHub. Statusen syns i verktygsfältet:

- ✓ Synkad — allt är sparat
- 💾 Sparar... — pågår
- ✗ Fel — något gick fel, försök igen

Klicka **🔄 Hämta senaste** för att ladda in ändringar som någon annan har gjort.

## Filer

| Fil | Beskrivning |
|-----|-------------|
| `kategoribilder-galleri_v2.html` | Applikationen |
| `data.json` | Galleriedata (kategorier och bilder) |

## Samarbete

Varje användare skapar sin egen GitHub-token och anger den via ⚙-knappen. Ändringar sparas till `data.json` i det här repot och är synliga för alla efter att de klickat **🔄 Hämta senaste**.
