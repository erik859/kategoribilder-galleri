// Bygger om Cykelhusets (cykelvardag) woo-träd så det matchar cykelvardag.se.
// Källa: cykelvardag.se product_cat-sitemap + huvudmenyn (2026-06-13).
// Kör: node scripts/build-cykelvardag-woo.mjs
import { readFileSync, writeFileSync } from 'fs'

// L1 -> L2 -> [L3]. L2 utan L3 = tom array.
const tree = {
  'Cykeldelar': {
    'Bromsar': ['Bromsbelägg', 'Bromshandtag', 'Bromsskivor', 'Bromstillbehör', 'Bromsvajrar / Bromsslangar', 'Fälgbromsar', 'Skivbromsar'],
    'Cockpit / styre': ['Handtag / Styrlindor', 'Ringklockor', 'Styren'],
    'Drivlina': ['Framdrev/Klinga / Remklinga', 'Kassetter/Bakdrev', 'Kedjor / Remmar', 'Vevlager', 'Vevpartier'],
    'Elcykeldelar': ['Reglage', 'Tillbehör / Övrigt'],
    'Hjul': ['Kompletta hjul', 'Tillbehör / Övrigt'],
    'Ram & Gaffel': ['Tillbehör / Övrigt'],
    'Växlar': ['Bakväxel', 'Elektroniska växeldelar', 'Framväxel', 'Växelreglage', 'Växeltillbehör', 'Växelvajrar'],
    'Övriga delar': ['Övrigt'],
  },
  'Cyklar': {
    'Barn och ungdomscyklar': [],
    'Elcyklar': [],
    'Gravelbikes': [],
    'Hybridcyklar': [],
    'Mountainbikes': [],
    'Racercyklar': [],
    'Standardcyklar': [],
  },
  'Kläder': {
    'Acessoarer': ['Strumpor', 'Övrigt'],
    'Cykelregnkläder': ['Skoskydd'],
  },
  'Personlig utrustning': {
    'Cykelverktyg': ['Verktyg'],
    'El-accessoarer': ['Cykeldatorer', 'Fästen', 'Tillbehör / Övrigt'],
    'Sportnutrition': ['Sportnutrition'],
    'Tillbehör / Övrigt': ['Tillbehör / Övrigt'],
  },
  'Övrigt': {
    'Cykeltrainer': [],
    'Tillbehör / Övrigt': [],
  },
  'Tillbehör': {
    'Barnstolar': ['Tillbehör / Övrigt'],
    'Belysning': ['Framlampa'],
    'Cykelflaskor': ['Flaskhållare', 'Vattenflaskor'],
    'Cykelförvaring': ['Cykelgarage'],
    'Cykelhjälm': ['Mountainbikehjälmar', 'Racerhjälmar'],
    'Cykelskor': ['Landsvägsskor', 'Mountainbikeskor', 'Trekking / City-skor', 'Tillbehör / Övrigt'],
    'Cykelvård': ['Smörjmedel och rengöring'],
    'Däck & slang': ['Däck', 'Slangar'],
    'Lås': ['Bygellås', 'Kättinglås', 'Vikbara lås', 'Wirelås'],
    'Pedaler': ['Klickpedaler', 'Plattformspedaler', 'Standardpedaler'],
    'Pumpar': ['Golvpumpar', 'Minipumpar', 'Pumptillbehör'],
    'På cykeln': ['Stänkskärmar'],
    'Sadlar och tillbehör': ['Sadelstolpar', 'Sadlar'],
    'Väskor & cykelkorgar': ['Tillbehör / Övrigt'],
  },
}

const coll = new Intl.Collator('sv')
const woo = []
for (const l1 of Object.keys(tree).sort(coll.compare)) {
  const l2s = Object.keys(tree[l1]).sort(coll.compare)
  for (const l2 of l2s) {
    const l3s = [...tree[l1][l2]].sort(coll.compare)
    if (l3s.length === 0) woo.push([l1, l2, ''])
    else for (const l3 of l3s) woo.push([l1, l2, l3])
  }
}

const path = new URL('../public/data-cykelvardag.json', import.meta.url)
const data = JSON.parse(readFileSync(path, 'utf8'))
const before = (data.woo || []).length
data.woo = woo
writeFileSync(path, JSON.stringify(data), 'utf8')

const nL1 = Object.keys(tree).length
const nL2 = Object.values(tree).reduce((s, o) => s + Object.keys(o).length, 0)
const nL3 = Object.values(tree).reduce((s, o) => s + Object.values(o).reduce((a, l) => a + l.length, 0), 0)
console.log(`woo: ${before} -> ${woo.length} rader  (${nL1} L1, ${nL2} L2, ${nL3} L3)`)
