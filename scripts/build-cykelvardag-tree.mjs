// Bygger om cykelvardag-projektets (data-cykelvardag-2.json) woo-träd så det speglar
// cykelvardag.se exakt (från product_cat-sitemap), med slug som kategorikod i mapping.
// Behåller gallery (bilderna). Kör: node scripts/build-cykelvardag-tree.mjs
import fs from 'fs'

const FILE = 'public/data-cykelvardag-2.json'

// cykelvardag.se:s kategorisökvägar (slugs) från product_cat-sitemap.
const SLUGS = `
cyklar/elcyklar
cyklar/gravelbikes
cyklar/hybrider
cyklar/mtb
cyklar/racer
cykeldelar/bromsar/bromsbelagg
cykeldelar/bromsar/bromshandtag
cykeldelar/bromsar/bromsskivor
cykeldelar/bromsar/bromstillbehor
cykeldelar/bromsar/bromsvajrar-bromsslangar
cykeldelar/bromsar/falgbromsar
cykeldelar/bromsar/skivbromsar
cykeldelar/cockpit-styre/handtag-styrlindor
cykeldelar/cockpit-styre/ringklockor
cykeldelar/cockpit-styre/styren
cykeldelar/drivlina/framdrev-klinga-remklinga
cykeldelar/drivlina/kassetter-bakdrev
cykeldelar/drivlina/kedjor-remmar
cykeldelar/drivlina/vevlager
cykeldelar/drivlina/vevpartier
cykeldelar/hjul/kompletta-hjul
cykeldelar/ovriga-delar/ovrigt
cykeldelar/vaxlar/bakvaxel
cykeldelar/vaxlar/elektroniska-vaxeldelar
cykeldelar/vaxlar/framvaxel
cykeldelar/vaxlar/vaxelreglage
cykeldelar/vaxlar/vaxeltillbehor
cykeldelar/vaxlar/vaxelvajrar
klader/acessoarer/ovrigt-acessoarer
klader/acessoarer/strumpor
klader/cykelregnklader/skoskydd
personlig-utrustning/cykelverktyg/verktyg
personlig-utrustning/el-accessoarer/cykeldatorer
personlig-utrustning/el-accessoarer/fasten
personlig-utrustning/sportnutrition
tillbehor/barnstolar
tillbehor/belysning/framlampa
tillbehor/cykelflaskor/flaskhallare
tillbehor/cykelflaskor/vattenflaskor
tillbehor/cykelforvaring/cykelgarage
tillbehor/cykelhjalm/mountainbikehjalmar
tillbehor/cykelhjalm/racerhjalmar
tillbehor/cykelskor/landsvagsskor
tillbehor/cykelskor/mountainbikeskor
tillbehor/cykelskor/trekking-city-skor
tillbehor/cykelvard/smorjmedel-och-rengoring
tillbehor/dack-slang/dack
tillbehor/dack-slang/slangar
tillbehor/las/bygellas
tillbehor/las/kattinglas
tillbehor/las/vikbara-las
tillbehor/las/wirelas
tillbehor/pa-cykeln/stankskarmar
tillbehor/pedaler/klickpedaler
tillbehor/pedaler/plattformspedaler
tillbehor/pedalar/standardpedalar
tillbehor/pumpar/golvpumpar
tillbehor/pumpar/minipumpar
tillbehor/pumpar/pumptillbehor
tillbehor/sadlar-och-tillbehor/sadelstolpar
tillbehor/sadlar-och-tillbehor/sadlar
tillbehor/vaskor-cykelkorgar
ovrigt-2/cykeltrainer
`.trim().split('\n').map(s => s.trim()).filter(Boolean)

// slug-segment -> korrekt svenskt visningsnamn (default = de-slugify + versal)
const NAME = {
  cyklar:'Cyklar', elcyklar:'Elcyklar', gravelbikes:'Gravelbikes', hybrider:'Hybrider', mtb:'MTB', racer:'Racer',
  cykeldelar:'Cykeldelar', bromsar:'Bromsar', bromsbelagg:'Bromsbelägg', bromshandtag:'Bromshandtag',
  bromsskivor:'Bromsskivor', bromstillbehor:'Bromstillbehör', 'bromsvajrar-bromsslangar':'Bromsvajrar/Bromsslangar',
  falgbromsar:'Fälgbromsar', skivbromsar:'Skivbromsar', 'cockpit-styre':'Cockpit/Styre',
  'handtag-styrlindor':'Handtag/Styrlindor', ringklockor:'Ringklockor', styren:'Styren',
  drivlina:'Drivlina', 'framdrev-klinga-remklinga':'Framdrev/Klinga/Remklinga', 'kassetter-bakdrev':'Kassetter/Bakdrev',
  'kedjor-remmar':'Kedjor/Remmar', vevlager:'Vevlager', vevpartier:'Vevpartier', hjul:'Hjul', 'kompletta-hjul':'Kompletta hjul',
  'ovriga-delar':'Övriga delar', ovrigt:'Övrigt', vaxlar:'Växlar', bakvaxel:'Bakväxel',
  'elektroniska-vaxeldelar':'Elektroniska växeldelar', framvaxel:'Framväxel', vaxelreglage:'Växelreglage',
  vaxeltillbehor:'Växeltillbehör', vaxelvajrar:'Växelvajrar',
  klader:'Kläder', acessoarer:'Accessoarer', 'ovrigt-acessoarer':'Övrigt Accessoarer', strumpor:'Strumpor',
  cykelregnklader:'Cykelregnkläder', skoskydd:'Skoskydd',
  'personlig-utrustning':'Personlig utrustning', cykelverktyg:'Cykelverktyg', verktyg:'Verktyg',
  'el-accessoarer':'El-accessoarer', cykeldatorer:'Cykeldatorer', fasten:'Fästen', sportnutrition:'Sportnutrition',
  tillbehor:'Tillbehör', barnstolar:'Barnstolar', belysning:'Belysning', framlampa:'Framlampa',
  cykelflaskor:'Cykelflaskor', flaskhallare:'Flaskhållare', vattenflaskor:'Vattenflaskor',
  cykelforvaring:'Cykelförvaring', cykelgarage:'Cykelgarage', cykelhjalm:'Cykelhjälm',
  mountainbikehjalmar:'Mountainbikehjälmar', racerhjalmar:'Racerhjälmar', cykelskor:'Cykelskor',
  landsvagsskor:'Landsvägsskor', mountainbikeskor:'Mountainbikeskor', 'trekking-city-skor':'Trekking/City-skor',
  cykelvard:'Cykelvård', 'smorjmedel-och-rengoring':'Smörjmedel och rengöring', 'dack-slang':'Däck & slang',
  dack:'Däck', slangar:'Slangar', las:'Lås', bygellas:'Bygellås', kattinglas:'Kättinglås',
  'vikbara-las':'Vikbara lås', wirelas:'Wirelås', 'pa-cykeln':'På cykeln', stankskarmar:'Stänkskärmar',
  pedaler:'Pedaler', pedalar:'Pedaler', klickpedaler:'Klickpedaler', plattformspedaler:'Plattformspedaler',
  standardpedalar:'Standardpedaler', pumpar:'Pumpar', golvpumpar:'Golvpumpar', minipumpar:'Minipumpar',
  pumptillbehor:'Pumptillbehör', 'sadlar-och-tillbehor':'Sadlar och tillbehör', sadelstolpar:'Sadelstolpar',
  sadlar:'Sadlar', 'vaskor-cykelkorgar':'Väskor & cykelkorgar', 'ovrigt-2':'Övrigt', cykeltrainer:'Cykeltrainer',
}
const deslug = s => s.split('-').join(' ').replace(/^./, c => c.toUpperCase())
const nameOf = slug => NAME[slug] || deslug(slug)

// Bygg lövsökvägar (en path är ett löv om ingen annan path börjar med path + '/')
const isLeaf = p => !SLUGS.some(o => o !== p && o.startsWith(p + '/'))
const leaves = SLUGS.filter(isLeaf)

// Bygg woo-rader [L1,L2,L3] + mapping med slug-koder
const woo = []
const mapping = []
const seen = new Set()
for (const path of leaves) {
  const segs = path.split('/')
  const names = segs.map(nameOf)
  const codes = segs.slice()                    // slug-segmenten = koderna
  const l1 = names[0] || '', l2 = names[1] || '', l3 = names[2] || ''
  const key = [l1, l2, l3].join('|')
  if (seen.has(key)) continue
  seen.add(key)
  woo.push([l1, l2, l3])
  mapping.push({
    bidex_name: '', bidex_code: '', dst_name: '', dst_code: '',
    wc_cat_name_1: l1, wc_cat_code_1: codes[0] || '',
    wc_cat_name_2: l2, wc_cat_code_2: codes[1] || '',
    wc_cat_name_3: l3, wc_cat_code_3: codes[2] || '',
    cv_slug: path,
  })
}

const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const before = { woo: (d.woo||[]).length, mapping: (d.mapping||[]).length, gallery: (d.gallery||[]).length }
d.woo = woo
d.mapping = mapping
fs.writeFileSync(FILE, JSON.stringify(d))

// Skriv ut trädet för granskning
const tree = {}
for (const [l1,l2,l3] of woo) { tree[l1] = tree[l1]||{}; if(l2){tree[l1][l2]=tree[l1][l2]||[]; if(l3)tree[l1][l2].push(l3);} }
console.log('FÖRE:', JSON.stringify(before), '\nEFTER: woo='+woo.length+' mapping='+mapping.length+' gallery='+(d.gallery||[]).length+' (oförändrat)')
console.log('\n=== NYTT TRÄD (cykelvardag = cykelvardag.se) ===')
for (const l1 of Object.keys(tree)) {
  const l2s = Object.keys(tree[l1])
  console.log('▸ '+l1+'  ('+l2s.length+' underkat)')
  for (const l2 of l2s) console.log('    • '+l2 + (tree[l1][l2].length ? ': '+tree[l1][l2].join(', ') : ''))
}
