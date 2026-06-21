// Normaliserar namn i båda projekten:
//  1. Huvudkort (is_header) döps efter sektionen (ej "(huvud)"); ★-markering kvar
//  2. Alla bildnamn (fn) translittereras åäö → a/a/o (webbsäkra)
//  3. Övrigt-kategorier i woo (+mapping) döps om till "<förälder>_övrigt"
// Kör: node scripts/normalize-names.mjs
import { readFileSync, writeFileSync } from 'fs'

const translit = s => String(s ?? '')
  .replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o')
  .replace(/Å/g,'A').replace(/Ä/g,'A').replace(/Ö/g,'O')

const catToFilename = cat => translit(cat)
  .replace(/[/\\:*?"<>|]/g,'-').replace(/\s+/g,'_').replace(/-+/g,'-')
  .replace(/^-|-$/g,'').toLowerCase() + '.jpg'

// Behåller åäö i kategorinamnet (bara bildnamn/slug ska vara åäö-fritt)
const ovrigtName = parent => parent.toLowerCase()
  .replace(/&/g,' ').replace(/[^0-9a-zåäö]+/g,'_')
  .replace(/_+/g,'_').replace(/^_|_$/g,'') + '_övrigt'

const isCatchall = name => !!name && (name === 'Övrigt' || name.startsWith('Övrigt ') || name === 'Tillbehör / Övrigt')

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  let hdr = 0, fnFix = 0, wooOv = 0, mapOv = 0

  for (const s of d.gallery) {
    for (const c of s.cards) {
      if (c.is_header) {
        if (c.cat !== s.section) { c.cat = s.section; hdr++ }
        c.fn = catToFilename(s.section)
        c.seoAlt = `${s.section} cykel`
      }
      if (c.fn) { const nf = translit(c.fn); if (nf !== c.fn) { c.fn = nf; fnFix++ } }
    }
  }

  d.woo = d.woo.map(([l1, l2, l3]) => {
    if (isCatchall(l3)) { wooOv++; return [l1, l2, ovrigtName(l2)] }
    if (!l3 && isCatchall(l2)) { wooOv++; return [l1, ovrigtName(l1), l3] }
    return [l1, l2, l3]
  })

  for (const m of d.mapping) {
    if (isCatchall(m.wc_cat_name_3) && m.wc_cat_name_2) { m.wc_cat_name_3 = ovrigtName(m.wc_cat_name_2); mapOv++ }
    else if (!m.wc_cat_name_3 && isCatchall(m.wc_cat_name_2) && m.wc_cat_name_1) { m.wc_cat_name_2 = ovrigtName(m.wc_cat_name_1); mapOv++ }
  }

  writeFileSync(path, JSON.stringify(d), 'utf8')
  console.log(`${file}: huvudkort omdöpta=${hdr}, fn åäö-fixade=${fnFix}, övrigt woo=${wooOv}, övrigt mapping=${mapOv}`)
}

apply('data.json')
apply('data-cykelvardag.json')
