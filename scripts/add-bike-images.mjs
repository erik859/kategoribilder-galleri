// Lägger till bildkort för cykel-kategorierna med bilder hämtade från
// cykelnatur.se (cdn.abicart.com-URL:er, ingen base64). Webshop-vyn matchar
// dessa mot woo-kategorierna på namn. Idempotent. Kör på båda projekten.
// Kör: node scripts/add-bike-images.mjs
import { readFileSync, writeFileSync } from 'fs'

const translit = s => String(s ?? '').replace(/å/g,'a').replace(/ä/g,'a').replace(/ö/g,'o').replace(/Å/g,'A').replace(/Ä/g,'A').replace(/Ö/g,'O')
const catToFilename = cat => translit(cat).replace(/[/\\:*?"<>|]/g,'-').replace(/\s+/g,'_').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase() + '.jpg'

const B = 'https://cdn.abicart.com/shop/ws9/113209/art9'
const IMG = {
  MTB:      `${B}/h6945/221806945-origpic-564c78.webp`,
  GRAVEL:   `${B}/h5420/224875420-origpic-407eac.jpg`,
  HYBRID:   `${B}/h2205/224552205-origpic-89eafe.jpg`,
  ELCYKEL:  'https://cdn.abicart.com/shop/images/223642885-origpic-fa39b1/ws9/113209/art9/h2885/101E-101-RD30_1.png',
  BARN:     `${B}/h8947/224498947-origpic-85ec21.jpg`,
  RACER:    `${B}/h6827/221806827-origpic-bc3f8f.webp`,
  LAST:     `${B}/h6825/218586825-origpic-f352a6.jpg`,
  STANDARD: `${B}/h4823/210814823-origpic-ef17ae.jpg`,
}

// [kategorinamn (matchar woo), bild]
const CYKLAR = [
  ['Mountainbike', IMG.MTB], ['Hardtail', IMG.MTB], ['Heldämpad', IMG.MTB],
  ['Hybridcyklar', IMG.HYBRID], ['Trekking/Hybrid', IMG.HYBRID], ['Gravelhybrid', IMG.GRAVEL],
  ['Stad/Urban', IMG.STANDARD],
  ['Racercyklar', IMG.RACER], ['Gravelcyklar', IMG.GRAVEL], ['Triathlon/TT', IMG.RACER],
  ['Elcyklar', IMG.ELCYKEL], ['El-MTB', IMG.ELCYKEL], ['El-Hybrid', IMG.ELCYKEL],
  ['El-City', IMG.ELCYKEL], ['El-Racer', IMG.ELCYKEL], ['El-Gravel', IMG.ELCYKEL], ['El-Lastcyklar', IMG.LAST],
]
const BARN = [['Juniorcyklar', IMG.BARN], ['Balanscyklar', IMG.BARN]]

const card = (cat, img, header=false) => ({
  type: 'image', cat, manualUrl: img, fn: catToFilename(cat),
  seoAlt: `${cat} cykel`, is_header: header, fnCustom: false,
})

function section(name, headerImg, items) {
  return { section: name, cards: [card(name, headerImg, true), ...items.map(([c, i]) => card(c, i))] }
}

function apply(file) {
  const path = new URL(`../public/${file}`, import.meta.url)
  const d = JSON.parse(readFileSync(path, 'utf8'))
  // idempotent: ta bort ev. tidigare bild-sektioner
  d.gallery = d.gallery.filter(s => s.section !== 'Cyklar' && s.section !== 'Barncyklar')
  d.gallery.push(section('Cyklar', IMG.MTB, CYKLAR))
  d.gallery.push(section('Barncyklar', IMG.BARN, BARN))
  writeFileSync(path, JSON.stringify(d), 'utf8')
  const n = CYKLAR.length + BARN.length + 2
  console.log(`${file}: la till 2 bild-sektioner, ${n} kort (cykelnatur.se-bilder)`)
}

apply('data.json')
apply('data-cykelvardag.json')
