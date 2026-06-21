// Flyttar personlig-utrustnings-kategorier (hjälm/skor/glasögon/kläder/kroppsskydd)
// från Tillbehör → Personlig utrustning, dedupar Kroppsskydd-dubbletten, och
// håller mapping i synk. Idempotent. Kör: node scripts/move-to-personlig-utrustning.mjs
import { readFileSync, writeFileSync } from 'fs'

const FROM = 'Tillbehör'
const TO = 'Personlig utrustning'
const MOVE = new Set(['Cykelhjälm', 'Cykelskor', 'Cykelglasögon', 'Kroppsskydd', 'Cykelkläder', 'Kläder', 'Glasögon'])

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const d = JSON.parse(readFileSync(path, 'utf8'))

  let moved = 0
  d.woo = d.woo.map(([l1, l2, l3]) => {
    if (l1 === FROM && MOVE.has(l2)) { moved++; return [TO, l2, l3] }
    return [l1, l2, l3]
  })
  // dedupe identiska rader (Kroppsskydd fanns i båda)
  const seen = new Set()
  const before = d.woo.length
  d.woo = d.woo.filter(r => { const k = r.join(''); if (seen.has(k)) return false; seen.add(k); return true })
  // regruppera så varje L1 är sammanhängande (behåll första-sedd-ordning)
  const l1order = [...new Set(d.woo.map(r => r[0]))]
  d.woo = l1order.flatMap(l1 => d.woo.filter(r => r[0] === l1))
  // mapping i synk
  let mapMoved = 0
  for (const m of d.mapping) {
    if (m.wc_cat_name_1 === FROM && MOVE.has(m.wc_cat_name_2)) { m.wc_cat_name_1 = TO; mapMoved++ }
  }

  writeFileSync(path, JSON.stringify(d), 'utf8')
  console.log(`${file}: flyttade ${moved} woo-rader, tog bort ${before - d.woo.length} dubbletter, mapping ${mapMoved}`)
}

apply('data.json')
apply('data-cykelvardag.json')
