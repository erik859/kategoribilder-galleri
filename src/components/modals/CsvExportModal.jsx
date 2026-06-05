import { useState } from 'react'
import { useStore } from '../../store'
import { getWooPath, getMappingRow, catToFilename } from '../../utils/helpers'

export default function CsvExportModal({ onClose }) {
  const { gallery, woo, mapping } = useStore()
  const [selected, setSelected] = useState(() => {
    const s = {}
    gallery.forEach((sect, si) => sect.cards.forEach((_, ci) => { s[`${si}-${ci}`] = true }))
    return s
  })

  function toggleAll(v) {
    const s = {}
    gallery.forEach((sect, si) => sect.cards.forEach((_, ci) => { s[`${si}-${ci}`] = v }))
    setSelected(s)
  }
  function toggleFilter(f) {
    const s = {}
    gallery.forEach((sect, si) => sect.cards.forEach((c, ci) => {
      s[`${si}-${ci}`] = f === 'has' ? c.type === 'image' : c.type !== 'image'
    }))
    setSelected(s)
  }

  function doExport() {
    const rows = [['id','bidex_name','bidex_code','dst_name','dst_code','wc_cat_name_1','wc_cat_code_1','wc_cat_name_2','wc_cat_code_2','wc_cat_name_3','wc_cat_code_3','galleri_sektion','galleri_kategori','huvudkort','status','har_bild','drive_id','bildnamn']]
    gallery.forEach((sect, si) => {
      sect.cards.forEach((c, ci) => {
        if (!selected[`${si}-${ci}`]) return
        const wp = getWooPath(c.cat, sect.section, woo)
        const mr = getMappingRow(c.cat, sect.section, mapping) || {}
        const id = `${sect.section.replace(/\s+/g,'_')}__${c.cat.replace(/\s+/g,'_')}`
        rows.push([id, mr.bidex_name||'', mr.bidex_code||'', mr.dst_name||'', mr.dst_code||'',
          mr.wc_cat_name_1||wp.l1, mr.wc_cat_code_1||'', mr.wc_cat_name_2||wp.l2, mr.wc_cat_code_2||'',
          mr.wc_cat_name_3||wp.l3, mr.wc_cat_code_3||'',
          sect.section, c.cat, c.is_header?'Ja':'',
          c.type==='image'?'Har bild':'Saknar bild', c.type==='image'?'Ja':'Nej',
          c.drive_id||'', c.fn||''])
      })
    })
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv)
    a.download = 'kategoribilder.csv'; a.click()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 560, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>⬇ Exportera CSV — välj vad som ska inkluderas</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => toggleAll(true)}>Markera alla</button>
          <button className="btn-secondary" onClick={() => toggleAll(false)}>Avmarkera alla</button>
          <button style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #27AE60', color: '#27AE60', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => toggleFilter('has')}>Bara med bild</button>
          <button style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #f5c07a', color: '#856404', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => toggleFilter('miss')}>Bara utan bild</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          {gallery.map((sect, si) => (
            <div key={si}>
              <div className="csv-sect-hdr">
                <input type="checkbox" checked={sect.cards.every((_, ci) => selected[`${si}-${ci}`])}
                  onChange={e => setSelected(prev => {
                    const s = {...prev}; sect.cards.forEach((_, ci) => { s[`${si}-${ci}`] = e.target.checked }); return s
                  })} />
                {sect.section} ({sect.cards.length} kategorier)
              </div>
              {sect.cards.map((c, ci) => (
                <div key={ci} className="csv-cat-row" style={{ color: c.type === 'image' ? '#333' : '#aaa' }}>
                  <input type="checkbox" checked={!!selected[`${si}-${ci}`]}
                    onChange={e => setSelected(prev => ({...prev, [`${si}-${ci}`]: e.target.checked}))} />
                  {c.cat} {c.type === 'image' ? '✓' : '⚠'}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Avbryt</button>
          <button style={{ padding: '6px 16px', fontSize: 12, background: '#27AE60', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={doExport}>⬇ Exportera</button>
        </div>
      </div>
    </div>
  )
}
