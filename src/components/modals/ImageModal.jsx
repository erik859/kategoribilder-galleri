import { useState, useRef } from 'react'
import { useStore } from '../../store'
import { catToFilename } from '../../utils/helpers'

export default function ImageModal({ si, ci, onClose }) {
  const { gallery, updateCard, pushUndo, saveState } = useStore()
  const card = gallery[si].cards[ci]
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState(card.seoAlt || card.cat + ' – ' + gallery[si].section + ' cykel')
  const [fn, setFn] = useState(card.fnCustom ? card.fn : '')
  const [preview, setPreview] = useState(card.manualUrl || (card.drive_id ? `https://lh3.googleusercontent.com/d/${card.drive_id}=w400` : ''))
  const [dropOver, setDropOver] = useState(false)
  const fileRef = useRef()

  function handleUrl(v) {
    setUrl(v)
    if (v) setPreview(v)
  }

  function readFile(file) {
    const r = new FileReader()
    r.onload = e => { setUrl(e.target.result); setPreview(e.target.result) }
    r.readAsDataURL(file)
  }

  function save() {
    const hasNewImage = !!url
    // Tillåt spara om man bara ändrar alt/filnamn på ett befintligt bildkort;
    // blockera bara när kortet saknar bild OCH ingen ny bild angetts.
    if (!hasNewImage && card.type !== 'image') return
    pushUndo()
    const updates = {
      fn: fn.trim() ? fn.trim() : catToFilename(card.cat),
      fnCustom: !!fn.trim(),
      seoAlt: alt || card.cat + ' – ' + gallery[si].section + ' cykel',
    }
    if (hasNewImage) { updates.type = 'image'; updates.manualUrl = url }
    updateCard(si, ci, updates)
    saveState()
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>{gallery[si].section} → {card.cat}</h3>
        <p className="sub">{card.drive_id ? 'Byt ut nuvarande bild' : 'Lägg till bild för denna kategori'}</p>

        {preview && <img src={preview} style={{ width: '100%', height: 190, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />}

        <div className={`dropzone ${dropOver ? 'over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDropOver(true) }}
          onDragLeave={() => setDropOver(false)}
          onDrop={e => { e.preventDefault(); setDropOver(false); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) readFile(f); else { const u = e.dataTransfer.getData('text/plain'); if (u) handleUrl(u) } }}>
          Dra & släpp bildfil eller URL hit
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input type="text" value={url} onChange={e => handleUrl(e.target.value)} placeholder="Klistra in bild-URL eller Google Drive-länk..." style={{ flex: 1 }} />
          <button className="btn-primary" onClick={save}>Spara</button>
        </div>

        <label className="field-label">Alt-text (SEO)</label>
        <input type="text" value={alt} onChange={e => setAlt(e.target.value)} placeholder={`${card.cat} – ${gallery[si].section} cykel`} />

        <label className="field-label">Bildnamn (lämna tomt = kategorinamn automatiskt, placeholder: {catToFilename(card.cat)})</label>
        <input type="text" value={fn} onChange={e => setFn(e.target.value)} placeholder={catToFilename(card.cat)} />

        <div className="modal-row">
          <button className="btn-blue" onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent((card.cat || '') + ' cykel')}`, '_blank')}>🔍 Sök Google Images</button>
          <button className="btn-green" onClick={() => fileRef.current.click()}>📁 Lokal fil</button>
          <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={onClose}>Stäng</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) readFile(e.target.files[0]); e.target.value = '' }} />
      </div>
    </div>
  )
}
