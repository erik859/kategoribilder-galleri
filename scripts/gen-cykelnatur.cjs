// Genererar public/data-cykelnatur.json (bildbehov-tracker för cykelnatur.se guider + kategorier)
// samt registrerar projektet i public/projects.json. Kör: node scripts/gen-cykelnatur.cjs
const fs = require('fs');
const path = require('path');
const PUB = path.join(__dirname, '..', 'public');

const G = q => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`;
// slot(filnamn-suffix, motiv/seoAlt, sök-query, källa) -> missing-kort
const slot = (fn, alt, q, src, header = false) => ({
  type: 'missing', cat: alt, is_header: header, fn, seoAlt: alt,
  search_url: G(q), source: src,
});

// section(slug, visningsnamn, [slots]) — första slotten blir header
const sec = (slug, name, slots) => ({
  section: name, slug,
  cards: slots.map((s, i) => ({ ...s, fn: `${slug}/${s.fn}`, is_header: i === 0 })),
});

const gallery = [
  sec('clik-valve', 'Guide: Clik Valve', [
    slot('ventil-narbild.jpg', 'Clik Valve-insatsen i närbild', 'Schwalbe Clik Valve close up', 'LEV (Schwalbe)'),
    slot('pump-klick.jpg', 'Pumphuvud klickas på ventilen', 'Schwalbe Clik Valve pump head', 'LEV/EGET'),
    slot('scv-slang.jpg', 'Schwalbe-slang med SCV i förpackning', 'Schwalbe Clik Valve tube box', 'LEV/KATALOG'),
  ]),
  sec('shimano-service-center', 'Guide: Shimano Service Center', [
    slot('ssc-badge.jpg', 'Officiell Shimano Service Center-logga', 'Shimano Service Center logo badge', 'OFFICIELL (Shimano)'),
    slot('mekaniker-verkstad.jpg', 'Våra mekaniker vid arbetsbänken', 'cykelverkstad mekaniker', 'EGET'),
    slot('etube-diagnos.jpg', 'E-TUBE-diagnos mot elcykel', 'Shimano E-TUBE diagnostics laptop', 'EGET/LEV'),
  ]),
  sec('cykellas', 'Guide: Välja cykellås', [
    slot('las-fast-ram.jpg', 'Rätt låst cykel – ram i fast objekt', 'bike locked frame to rack', 'EGET'),
    slot('kryptonite-evolution-serie.jpg', 'Kryptonite Evolution-serien', 'Kryptonite Evolution lock series', 'LEV (Kryptonite)'),
  ]),
  sec('elcykelbatteri', 'Guide: Elcykelbatteri', [
    slot('batteri-narbild.jpg', 'STEPS-batteri i närbild / avtaget', 'Shimano STEPS ebike battery', 'LEV (Shimano)'),
  ]),
  sec('cykelhjalm-storlek', 'Guide: Cykelhjälm storlek', [
    slot('mata-huvud.jpg', 'Måttband runt huvudet', 'measure head circumference helmet', 'EGET'),
    slot('mips-kineticore.jpg', 'Rotationsskydd i genomskärning', 'MIPS helmet technology cutaway', 'LEV (Lazer/MIPS)'),
  ]),
  sec('byta-cykelkedja', 'Guide: Byta cykelkedja', [
    slot('slitagematt.jpg', 'Kedjeslitagemått mäts på cykel', 'chain wear indicator tool', 'EGET'),
    slot('sliten-vs-ny.jpg', 'Sliten och ny kedja bredvid varandra', 'worn vs new bike chain', 'EGET'),
  ]),
  sec('kedjeskotsel', 'Guide: Kedjeskötsel', [
    slot('rengora.jpg', 'Borsta/avfetta drivlinan', 'cleaning bike chain brush', 'EGET'),
    slot('smorja-droppe.jpg', 'Droppa olja per länk', 'lubricating bike chain drop', 'EGET'),
  ]),
  sec('vax-eller-olja', 'Guide: Vax eller olja', [
    slot('vaxad-kedja.jpg', 'Ren, vaxad kedja i närbild', 'waxed bike chain clean', 'EGET'),
  ]),
  sec('cykelbelysning', 'Guide: Cykelbelysning', [
    slot('ljusbild-morker.jpg', 'Framlampans ljusbild på mörk väg', 'bike light beam dark road', 'EGET/LEV'),
  ]),
  sec('valja-elcykel', 'Guide: Välja elcykel (uppgradering)', [
    slot('marke-batavus.jpg', 'Batavus-elcykel pressbild', 'Batavus e-bike', 'LEV (Batavus)'),
    slot('marke-winther.jpg', 'Winther-elcykel pressbild', 'Winther e-bike', 'LEV (Winther)'),
    slot('marke-ecoride-gazelle.jpg', 'Ecoride/Gazelle pressbild', 'Ecoride e-bike', 'LEV'),
  ]),
  sec('pendlingscykel', 'Guide: Pendlingscykel (uppgradering)', [
    slot('pendlare-trafik.jpg', 'Pendlare i stadstrafik', 'bike commuter city traffic', 'LEV/EGET'),
    slot('utrustad-cykel.jpg', 'Cykel m. skärmar, pakethållare, väska', 'commuter bike fenders rack panniers', 'LEV/EGET'),
  ]),
  // Kategorisidor som saknar bild
  {
    section: 'Kategori: bildbehov', slug: 'kategori',
    cards: [
      slot('huvudbild.jpg', 'Vinterdäck & dubbdäck – huvudbild', 'studded winter bike tire', 'KATALOG (dubbdäck)', true),
    ].map(s => ({ ...s, fn: `kategori/vinterdack/${s.fn.split('/').pop()}` })),
  },
];

const data = { gallery, woo: [], mapping: [] };
fs.writeFileSync(path.join(PUB, 'data-cykelnatur.json'), JSON.stringify(data, null, 1));

// Registrera projektet i projects.json (idempotent)
const pjPath = path.join(PUB, 'projects.json');
const projects = JSON.parse(fs.readFileSync(pjPath, 'utf8'));
if (!projects.some(p => p.id === 'cykelnatur')) {
  projects.push({ id: 'cykelnatur', name: 'Cykel & Natur (bildbehov)', file: 'data-cykelnatur.json' });
  fs.writeFileSync(pjPath, JSON.stringify(projects, null, 2));
}

const slots = gallery.reduce((n, s) => n + s.cards.length, 0);
console.log(`OK: ${gallery.length} sektioner, ${slots} bildslots. Projekt registrerat.`);
