export function catToFilename(cat) {
  return cat
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() + '.jpg'
}

export function getWooPath(catName, sectName, woo) {
  const cn = (catName || '').toLowerCase().trim()
  const sn = (sectName || '').toLowerCase().trim()
  for (const r of woo) {
    if (r[2] && r[2].toLowerCase().trim() === cn) return { l1: r[0], l2: r[1], l3: r[2] }
  }
  for (const r of woo) {
    if (r[1] && r[1].toLowerCase().trim() === sn && r[2] && r[2].toLowerCase().trim() === cn)
      return { l1: r[0], l2: r[1], l3: r[2] }
  }
  for (const r of woo) {
    if (r[1] && r[1].toLowerCase().trim() === sn) return { l1: r[0], l2: r[1], l3: catName }
  }
  return { l1: '', l2: sectName, l3: catName }
}

export function getMappingRow(catName, sectName, mapping) {
  const cn = (catName || '').toLowerCase().trim()
  const sn = (sectName || '').toLowerCase().trim()
  for (const m of mapping) {
    if (m.wc_cat_name_3 && m.wc_cat_name_3.toLowerCase().trim() === cn) return m
  }
  if (sn) {
    for (const m of mapping) {
      if (m.wc_cat_name_2?.toLowerCase().trim() === sn && m.wc_cat_name_3?.toLowerCase().trim() === cn) return m
    }
  }
  for (const m of mapping) {
    if (m.wc_cat_name_2?.toLowerCase().trim() === cn && !m.wc_cat_name_3) return m
  }
  if (sn) {
    for (const m of mapping) {
      if (m.wc_cat_name_2?.toLowerCase().trim() === sn && !m.wc_cat_name_3) return m
    }
  }
  return null
}

export function buildWooTree(woo) {
  const tree = {}
  for (const [l1, l2, l3] of woo) {
    if (!l1) continue
    if (!tree[l1]) tree[l1] = {}
    if (!tree[l1][l2]) tree[l1][l2] = []
    if (l3 && !tree[l1][l2].includes(l3)) tree[l1][l2].push(l3)
  }
  return tree
}
