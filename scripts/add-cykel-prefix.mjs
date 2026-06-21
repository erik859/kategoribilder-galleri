// Lägger SEO-prefixet "Cykel" på de tydligaste huvudkategorierna, konsekvent
// över gallerisektioner, huvudkort, woo-träd och mapping i båda projekten.
// Kör: node scripts/add-cykel-prefix.mjs
import { readFileSync, writeFileSync } from 'fs'

const translit = s => String(s ?? '').replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o').replace(/Å/g,'A').replace(/Ä/g,'A').replace(/Ö/g,'O')
const catToFilename = cat => translit(cat).replace(/[/\\:*?"<>|]/g,'-').replace(/\s+/g,'_').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase() + '.jpg'

const RENAME = {
  'Belysning': 'Cykelbelysning',
  'Bromsar': 'Cykelbromsar',
  'Sadlar': 'Cykelsadlar',
  'Pedaler': 'Cykelpedaler',
  'Hjul': 'Cykelhjul',
  'Glasögon': 'Cykelglasögon',
  'Kläder': 'Cykelkläder',
}

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  let sec = 0, woo = 0, map = 0

  for (const s of d.gallery) {
    const newSec = RENAME[s.section]
    if (!newSec) continue
    s.section = newSec; sec++
    for (const c of s.cards) {
      if (c.is_header) { c.cat = newSec; c.fn = catToFilename(newSec); c.seoAlt = `${newSec} cykel` }
      else { c.seoAlt = `${c.cat} – ${newSec} cykel` }
    }
  }

  d.woo = d.woo.map(r => r.map(x => { if (RENAME[x]) { woo++; return RENAME[x] } return x }))

  for (const m of d.mapping) {
    for (const k of ['wc_cat_name_1', 'wc_cat_name_2', 'wc_cat_name_3']) {
      if (RENAME[m[k]]) { m[k] = RENAME[m[k]]; map++ }
    }
  }

  writeFileSync(path, JSON.stringify(d), 'utf8')
  console.log(`${file}: sektioner=${sec}, woo-celler=${woo}, mapping-celler=${map}`)
}

apply('data.json')
apply('data-cykelvardag.json')
