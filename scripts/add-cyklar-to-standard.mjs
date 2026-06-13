// Lägger till en "Cyklar"-huvudkategori i Standard-projektet (public/data.json)
// med samma underkategorier som Cykelhuset. BIDEX-koder läggs till senare när
// de finns (Standard har idag inga koder för kompletta cyklar).
// Kör: node scripts/add-cyklar-to-standard.mjs
import { readFileSync, writeFileSync } from 'fs'

const L1 = 'Cyklar'
const subs = [
  'Barn och ungdomscyklar', 'Elcyklar', 'Gravelbikes', 'Hybridcyklar',
  'Mountainbikes', 'Racercyklar', 'Standardcyklar',
]

const path = new URL('../public/data.json', import.meta.url)
const data = JSON.parse(readFileSync(path, 'utf8'))

if (data.woo.some(r => r[0] === L1)) {
  console.log('Cyklar finns redan i Standard – inget gjort.')
} else {
  const coll = new Intl.Collator('sv')
  const cyklarRows = [...subs].sort(coll.compare).map(s => [L1, s, ''])
  // Lägg Cyklar först (kompletta cyklar är primär kategori)
  data.woo = [...cyklarRows, ...data.woo]
  writeFileSync(path, JSON.stringify(data), 'utf8')
  console.log(`La till ${L1} med ${cyklarRows.length} underkategorier i Standard.`)
  console.log('L1-ordning nu:', [...new Set(data.woo.map(r => r[0]))].join(', '))
}
