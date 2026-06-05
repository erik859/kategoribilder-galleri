import { useStore } from '../../store'
import { catToFilename } from '../../utils/helpers'

export default function MoveModal({ si, ci, onClose }) {
  const { gallery, pushUndo, saveState, setGallery } = useStore()
  const src = gallery[si].cards[ci]

  function doReplace(tsi, tci) {
    pushUndo()
    const g = gallery.map(s => ({ ...s, cards: [...s.cards] }))
    const dst = g[tsi].cards[tci]
    g[tsi].cards[tci] = { ...dst, type: src.type, manualUrl: src.manualUrl, drive_id: src.drive_id, fn: catToFilename(dst.cat), seoAlt: dst.cat + ' – ' + g[tsi].section + ' cykel' }
    if (src.manualUrl === undefined) delete g[tsi].cards[tci].manualUrl
    if (src.drive_id === undefined) delete g[tsi].cards[tci].drive_id
    g[si].cards[ci] = { ...src, type: 'missing', manualUrl: undefined, drive_id: undefined, fn: undefined, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(src.cat + ' cykel')}` }
    setGallery(g); saveState(); onClose()
  }

  function doInsert(tsi, pos) {
    pushUndo()
    const g = gallery.map(s => ({ ...s, cards: [...s.cards] }))
    const newCard = { ...src, is_header: false, seoAlt: src.cat + ' – ' + g[tsi].section + ' cykel' }
    g[si].cards[ci] = { ...src, type: 'missing', manualUrl: undefined, drive_id: undefined, fn: undefined, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(src.cat + ' cykel')}` }
    g[tsi].cards.splice(pos, 0, newCard)
    setGallery(g); saveState(); onClose()
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>↔ Flytta bild till annan kategori</h3>
        <p className="sub" style={{ marginBottom: 12 }}>Flytta: {gallery[si].section} → {src.cat}</p>
        <div id="move-list">
          {gallery.map((sect, tsi) => (
            <div key={tsi}>
              <div className="move-sect-hdr">{sect.section}</div>
              <div className="move-cat-item" style={{ color: '#27AE60', fontStyle: 'italic' }}
                onClick={() => doInsert(tsi, 0)}>⊕ Infoga längst upp i {sect.section}</div>
              {sect.cards.map((tcard, tci) => {
                if (tsi === si && tci === ci) return null
                return (
                  <div key={tci}>
                    <div className="move-cat-item">
                      <span style={{ color: tcard.type === 'image' ? '#888' : '#333' }}>{tcard.cat} {tcard.type === 'image' ? '✓' : ''}</span>
                      <button style={{ fontSize: 10, padding: '1px 6px', border: '1px solid #ddd', borderRadius: 3, background: 'white', cursor: 'pointer', color: '#c44' }}
                        onClick={() => doReplace(tsi, tci)}>Ersätt</button>
                    </div>
                    <div className="move-cat-item" style={{ color: '#27AE60', fontSize: 10, padding: '2px 8px', fontStyle: 'italic' }}
                      onClick={() => doInsert(tsi, tci + 1)}>⊕ Infoga efter {tcard.cat}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button className="btn-secondary" onClick={onClose}>Avbryt</button>
        </div>
      </div>
    </div>
  )
}
