// Bygger Cyklar + Barncyklar (BIDEX/DST-kodade) enligt Eriks BIDEX-tabell
// (Bereich 10 Bicycle, 11 Child/Youth, 12 Pedelec, 19 Used). Ersätter ev.
// befintlig platt Cyklar. Körs på både Standard och Cykelhuset.
// Kör: node scripts/build-bikes-bidex.mjs
import { readFileSync, writeFileSync } from 'fs'

// [L1, L2, L3, bidex_name, bidex_code, dst_code]  (L3='' => L2 är löv)
const bikes = [
  ['Cyklar', 'Mountainbike', 'Hardtail', 'Hardtail', '101010', '1E10'],
  ['Cyklar', 'Mountainbike', 'Heldämpad', 'Fully', '101020', '1E30'],
  ['Cyklar', 'Hybridcyklar', 'Gravelhybrid', 'Trekkingbike', '102010', '1F00'],
  ['Cyklar', 'Hybridcyklar', 'Trekking/Hybrid', 'Travel Bicycle', '102020', '1F00'],
  ['Cyklar', 'Stad/Urban', '', 'City', '', ''],
  ['Cyklar', 'Racercyklar', 'Racercyklar', 'Racing Bike', '104010', '1G10'],
  ['Cyklar', 'Racercyklar', 'Gravelcyklar', 'Gravel', '104020', '1G20'],
  ['Cyklar', 'Racercyklar', 'Triathlon/TT', 'Triathlon', '104030', '1G30'],
  ['Cyklar', 'Elcyklar', 'El-MTB', 'MTB (Pedelec)', '', '1E01'],
  ['Cyklar', 'Elcyklar', 'El-Hybrid', 'Trekking (Pedelec)', '', '1F01'],
  ['Cyklar', 'Elcyklar', 'El-City', 'Citybike (Pedelec)', '123010', '1A01'],
  ['Cyklar', 'Elcyklar', 'El-Racer', 'Race (Pedelec)', '', '1G01'],
  ['Cyklar', 'Elcyklar', 'El-Gravel', 'Race (Pedelec)', '', '1G11'],
  ['Cyklar', 'Elcyklar', 'El-Lastcyklar', 'Cargo Bike (Pedelec, BETA)', '', ''],
  ['Cyklar', 'Begagnade cyklar', 'Outlet', 'Used Vehicles', '', ''],
  ['Barncyklar', 'Barncyklar', '', '12-18" / 20-24"', '111010', '1C00'],
  ['Barncyklar', 'Juniorcyklar', '', '>26"', '111030', '1D00'],
  ['Barncyklar', 'Balanscyklar', '', 'Balance Bike', '112040', '1Z06'],
]

const BIKE_L1 = new Set(['Cyklar', 'Barncyklar'])
// gamla platta cykelvardag-namn som ska bort om de råkar ligga som egen L1
const OLD_FLAT = new Set(['Barn och ungdomscyklar', 'Elcyklar', 'Gravelbikes', 'Hybridcyklar', 'Mountainbikes', 'Racercyklar', 'Standardcyklar'])
const coll = new Intl.Collator('sv')

function emptyMapRow(bidex_name, bidex_code, dst_code, l1, l2, l3) {
  return {
    bidex_name, bidex_code, dst_name: '', dst_code,
    wc_cat_name_1: l1, wc_cat_code_1: '',
    wc_cat_name_2: l2, wc_cat_code_2: '',
    wc_cat_name_3: l3, wc_cat_code_3: '',
  }
}

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const data = JSON.parse(readFileSync(path, 'utf8'))

  // woo: ta bort all befintlig cykel-L1, samt gamla platta cykel-L2 under ev. 'Cyklar'
  const wooBefore = data.woo.length
  data.woo = data.woo.filter(r => !BIKE_L1.has(r[0]) && !(OLD_FLAT.has(r[1]) && r[0] === 'Cyklar'))
  const bikeWoo = bikes.map(([l1, l2, l3]) => [l1, l2, l3])
    .sort((a, b) => coll.compare(a[0], b[0]) || coll.compare(a[1], b[1]) || coll.compare(a[2], b[2]))
  data.woo = [...bikeWoo, ...data.woo]

  // mapping: ta bort ev. befintliga cykel-rader, lägg till nya med koder
  const mapBefore = data.mapping.length
  data.mapping = data.mapping.filter(m => !BIKE_L1.has(m.wc_cat_name_1))
  const bikeMap = bikes
    .filter(([, , , , code, dst]) => code || dst)
    .map(([l1, l2, l3, name, code, dst]) => emptyMapRow(name, code, dst, l1, l2, l3))
  data.mapping = [...bikeMap, ...data.mapping]

  writeFileSync(path, JSON.stringify(data), 'utf8')
  console.log(`${file}: woo ${wooBefore}->${data.woo.length} (+${bikeWoo.length} cykel), mapping ${mapBefore}->${data.mapping.length} (+${bikeMap.length} cykel)`)
}

apply('data.json')
apply('data-cykelvardag.json')
