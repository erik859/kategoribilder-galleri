// Döper om generiska uppsamlingskategorier ("Övrigt" / "Tillbehör / Övrigt")
// till "Övrigt <förälder>" så varje blir unik och beskrivande.
// Kör: node scripts/rename-ovrigt-cykelvardag.mjs
import { readFileSync, writeFileSync } from 'fs'

const CATCH = new Set(['Övrigt', 'Tillbehör / Övrigt'])
const path = new URL('../public/data-cykelvardag.json', import.meta.url)
const data = JSON.parse(readFileSync(path, 'utf8'))

const changes = []
const newWoo = []
for (const [l1, l2, l3] of data.woo) {
  const l2IsCatch = CATCH.has(l2)
  const newL2 = l2IsCatch ? `Övrigt ${l1}` : l2
  if (l2IsCatch && l2 !== newL2) changes.push([`${l1} ▸ ${l2}`, `${l1} ▸ ${newL2}`])

  if (!l3) { newWoo.push([l1, newL2, '']); continue }

  if (CATCH.has(l3)) {
    if (l2IsCatch) {
      // uppsamlingskat under uppsamlingskat → släpp den redundanta L3, L2 blir löv
      changes.push([`${l1} ▸ ${l2} ▸ ${l3}`, `(borttagen – L2 blir löv)`])
      newWoo.push([l1, newL2, ''])
    } else {
      const nl3 = `Övrigt ${l2}`
      changes.push([`${l1} ▸ ${l2} ▸ ${l3}`, `${l1} ▸ ${l2} ▸ ${nl3}`])
      newWoo.push([l1, newL2, nl3])
    }
  } else {
    newWoo.push([l1, newL2, l3])
  }
}

data.woo = newWoo
writeFileSync(path, JSON.stringify(data), 'utf8')

console.log(`Ändrade ${changes.length} namn:\n`)
for (const [a, b] of changes) console.log(`  ${a}\n    → ${b}`)
console.log(`\nwoo-rader: ${newWoo.length}`)
