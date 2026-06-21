// Andra passet: bilder för icke-cykel-kategorierna (delar/tillbehör) från
// cykelnatur.se. Lägger bara kort för kategorinamn som FINNS i resp. projekts
// woo och saknar bild. Idempotent. Kör: node scripts/add-accessory-images.mjs
import { readFileSync, writeFileSync } from 'fs'

const translit = s => String(s ?? '').replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o').replace(/Å/g,'A').replace(/Ä/g,'A').replace(/Ö/g,'O')
const catToFilename = cat => translit(cat).replace(/[/\\:*?"<>|]/g,'-').replace(/\s+/g,'_').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase() + '.jpg'

const C = 'https://cdn.abicart.com/shop/ws9/113209/art9'
const MAP = {
  'Däck & slang':            `${C}/h3585/215513585-origpic-9165f3.jpg`,
  'Cockpit / styre':         `${C}/h9415/218829415-origpic-1c9088.jpg`,
  'Bromstillbehör':          `${C}/h9489/218989489-origpic-a9c6d6.jpg`,
  'Elektroniska växeldelar': `${C}/h9321/218829321-origpic-5f2a31.jpg`,
  'Växeltillbehör':          `${C}/h9321/218829321-origpic-5f2a31.jpg`,
  'Sadlar och tillbehör':    `${C}/h0783/223070783-origpic-cb3322.jpg`,
  'Lås':                     `${C}/h0789/223070789-origpic-946364.jpg`,
  'Väskor & cykelkorgar':    `${C}/h0751/223070751-origpic-aa5ea5.jpg`,
  'Väskor':                  `${C}/h8436/224708436-origpic-9914fb.jpg`,
  'Pumpar':                  `${C}/h0661/223070661-origpic-dad0d8.jpg`,
  'Pumptillbehör':           `${C}/h0661/223070661-origpic-dad0d8.jpg`,
  'Sportnutrition':          `${C}/h1062/224701062-origpic-07f629.jpg`,
  'Skoskydd':                `${C}/h1252/224701252-origpic-cb5c76.jpg`,
  'Cykelregnkläder':         `${C}/h1252/224701252-origpic-cb5c76.jpg`,
}

const card = (cat, img) => ({ type:'image', cat, manualUrl:img, fn:catToFilename(cat), seoAlt:`${cat} cykel`, is_header:false, fnCustom:false })

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  const wooNames = new Set(d.woo.flatMap(r => [r[1], r[2]]).filter(Boolean).map(s => s.toLowerCase().trim()))
  const imgCats = new Set(d.gallery.flatMap(s => s.cards).filter(c => c.type==='image' && c.cat).map(c => c.cat.toLowerCase().trim()))
  d.gallery = d.gallery.filter(s => s.section !== 'Tillbehör (bilder)')
  const cards = Object.entries(MAP)
    .filter(([name]) => wooNames.has(name.toLowerCase().trim()) && !imgCats.has(name.toLowerCase().trim()))
    .map(([name, img]) => card(name, img))
  if (cards.length) d.gallery.push({ section: 'Tillbehör (bilder)', cards })
  writeFileSync(path, JSON.stringify(d), 'utf8')
  console.log(`${file}: ${cards.length} kort tillagda — ${cards.map(c=>c.cat).join(', ')}`)
}

apply('data.json')
apply('data-cykelvardag.json')
