import { useState } from 'react'
import { useStore } from '../store'
import { buildWooTree } from '../utils/helpers'

export default function WebshopView() {
  const { gallery, woo, setWoo, pushUndo, saveState } = useStore()
  const [openL1, setOpenL1] = useState({})
  const [openL2, setOpenL2] = useState({})
  const [wsFilter, setWsFilter] = useState('all')
  const [dragL2, setDragL2] = useState(null) // { l1, l2 }
  const [dropActiveL1, setDropActiveL1] = useState(null)

  const tree = buildWooTree(woo)

  function findImg(catName) {
    const n = catName.toLowerCase().trim()
    for (const s of gallery) for (const c of s.cards) {
      if (c.type === 'image' && c.cat?.toLowerCase().trim() === n)
        return c.manualUrl || (c.drive_id ? `https://lh3.googleusercontent.com/d/${c.drive_id}=w60` : null)
    }
    return null
  }

  function renameL1(old, nv) { if (nv !== old) { pushUndo(); setWoo(woo.map(r => r[0] === old ? [nv, r[1], r[2]] : r)); saveState() } }
  function renameL2(old, nv) { if (nv !== old) { pushUndo(); setWoo(woo.map(r => r[1] === old ? [r[0], nv, r[2]] : r)); saveState() } }
  function renameL3(old, nv) { if (nv !== old) { pushUndo(); setWoo(woo.map(r => r[2] === old ? [r[0], r[1], nv] : r)); saveState() } }

  function addL2(l1) { const n = prompt(`Ny underkategori under ${l1}:`); if (n?.trim()) { pushUndo(); setWoo([...woo, [l1, n.trim(), '']]); saveState() } }
  function addL3(l1, l2) { const n = prompt(`Ny kategori under ${l2}:`); if (n?.trim()) { pushUndo(); setWoo([...woo, [l1, l2, n.trim()]]); saveState() } }
  function delL2(l1, l2) { if (!confirm(`Ta bort "${l2}" och alla dess kategorier?`)) return; pushUndo(); setWoo(woo.filter(r => !(r[0] === l1 && r[1] === l2))); saveState() }
  function delL3(l1, l2, l3) { if (!confirm(`Ta bort "${l3}"?`)) return; pushUndo(); setWoo(woo.filter(r => !(r[0] === l1 && r[1] === l2 && r[2] === l3))); saveState() }

  function moveL2ToL1(l1From, l2, l1To) {
    pushUndo(); setWoo(woo.map(r => r[0] === l1From && r[1] === l2 ? [l1To, r[1], r[2]] : r)); saveState()
  }
  function moveL3Before(l1, l2, l3Moving, l3Target) {
    const row = woo.find(r => r[0] === l1 && r[1] === l2 && r[2] === l3Moving)
    if (!row) return
    const filtered = woo.filter(r => !(r[0] === l1 && r[1] === l2 && r[2] === l3Moving))
    const idx = filtered.findIndex(r => r[0] === l1 && r[1] === l2 && r[2] === l3Target)
    pushUndo()
    if (idx >= 0) { filtered.splice(idx, 0, row); setWoo(filtered) } else setWoo([...filtered, row])
    saveState()
  }

  const InlineEdit = ({ value, onSave, style }) => {
    const [editing, setEditing] = useState(false)
    const [val, setVal] = useState(value)
    if (editing) return <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      style={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none', fontFamily: 'Arial', minWidth: 60, ...style }}
      onBlur={() => { setEditing(false); onSave(val.trim() || value) }}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onSave(val.trim() || value) } if (e.key === 'Escape') setEditing(false) }} />
    return <span style={{ cursor: 'text', flex: 1 }} onClick={e => e.stopPropagation()} onDoubleClick={() => { setVal(value); setEditing(true) }}>{value}</span>
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {['all','miss','has'].map(f => (
          <button key={f} onClick={() => setWsFilter(f)}
            style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid #ccc', background: wsFilter === f ? '#1F4E79' : 'white', color: wsFilter === f ? 'white' : '#888', borderRadius: 6 }}>
            {f === 'all' ? 'Alla' : f === 'miss' ? 'Saknar bild' : 'Har bild'}
          </button>
        ))}
      </div>

      {Object.keys(tree).map(l1 => {
        const l2keys = Object.keys(tree[l1])
        const total = l2keys.reduce((n, l2) => n + tree[l1][l2].length, 0)
        const has = l2keys.reduce((n, l2) => n + tree[l1][l2].filter(l3 => findImg(l3)).length, 0)
        const pct = total ? Math.round(has / total * 100) : 0
        const isOpen = openL1[l1]

        return (
          <div key={l1} className="ws-l1"
            onDragOver={e => { if (dragL2) { e.preventDefault(); setDropActiveL1(l1) } }}
            onDragLeave={() => setDropActiveL1(null)}
            onDrop={e => {
              setDropActiveL1(null)
              if (!dragL2 || dragL2.l1 === l1) return
              e.preventDefault(); moveL2ToL1(dragL2.l1, dragL2.l2, l1); setDragL2(null)
            }}>
            <div className={`ws-l1-hdr ${dropActiveL1 === l1 ? 'drop-active' : ''}`}
              onClick={() => setOpenL1(p => ({...p, [l1]: !p[l1]}))}>
              <span className={`ws-chevron ${isOpen ? 'open' : ''}`}>&#9654;</span>
              <InlineEdit value={l1} onSave={nv => renameL1(l1, nv)} style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: '#666', fontWeight: 'normal' }}>{has}/{total} bilder &nbsp;</span>
              <span style={{ fontSize: 11, background: pct >= 80 ? '#d4edda' : pct >= 40 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 40 ? '#856404' : '#721c24', padding: '1px 8px', borderRadius: 10 }}>{pct}%</span>
              <button style={{ fontSize: 10, padding: '1px 7px', border: '1px solid #27AE60', color: '#27AE60', background: 'white', borderRadius: 3, cursor: 'pointer', marginLeft: 6 }}
                onClick={e => { e.stopPropagation(); addL2(l1) }}>＋ Lägg till</button>
            </div>

            <div className={`ws-l1-body ${isOpen ? 'open' : ''}`}>
              {l2keys.map(l2 => {
                const cats = tree[l1][l2]
                const l2img = findImg(l2)
                const l2open = openL2[`${l1}/${l2}`]

                return (
                  <div key={l2} className="ws-l2">
                    <div className="ws-l2-hdr">
                      <span className="drag-handle" draggable
                        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', ''); setDragL2({ l1, l2 }); e.currentTarget.parentNode.style.opacity = '0.5' }}
                        onDragEnd={e => { e.currentTarget.parentNode.style.opacity = ''; setDragL2(null) }}>⠿</span>
                      {cats.length > 0 && <span className={`ws-chevron ${l2open ? 'open' : ''}`} onClick={() => setOpenL2(p => ({...p, [`${l1}/${l2}`]: !p[`${l1}/${l2}`]}))} style={{ cursor: 'pointer' }}>&#9654;</span>}
                      {l2img ? <img src={l2img} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} /> : <span style={{ width: 20, height: 20, background: '#f0f0f0', borderRadius: 3, flexShrink: 0, display: 'inline-block' }} />}
                      <InlineEdit value={l2} onSave={nv => renameL2(l2, nv)} />
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#aaa' }}>{cats.length}</span>
                      <span style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                        <button className="drag-handle" style={{ border: '1px solid #27AE60', color: '#27AE60', background: 'white', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '1px 5px' }} onClick={() => addL3(l1, l2)}>＋</button>
                        <button style={{ border: '1px solid #e8a0a0', color: '#c44', background: 'white', borderRadius: 3, cursor: 'pointer', fontSize: 10, padding: '1px 5px' }} onClick={() => delL2(l1, l2)}>✕</button>
                      </span>
                    </div>

                    {cats.length > 0 && (
                      <div className={`ws-l3-list ${l2open ? 'open' : ''}`}>
                        <L3InsertSlot l1={l1} l2={l2} position="before" firstL3={cats[0]} moveL3Before={moveL3Before} />
                        {cats.map(l3 => {
                          if (!l3) return null
                          const img = findImg(l3)
                          if (wsFilter === 'has' && !img) return null
                          if (wsFilter === 'miss' && img) return null
                          return (
                            <div key={l3} style={{ display: 'contents' }}>
                              <div className={`ws-cat ${img ? 'has' : 'miss'}`}>
                                <span className="drag-handle" style={{ fontSize: 11 }} draggable
                                  onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', `wsl3:${l1}::${l2}::${l3}`); e.currentTarget.parentNode.style.opacity = '0.4' }}
                                  onDragEnd={e => e.currentTarget.parentNode.style.opacity = ''}>⠿</span>
                                {img ? <img src={img} style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} /> : <div className="ws-ph">?</div>}
                                <InlineEdit value={l3} onSave={nv => renameL3(l3, nv)} />
                                <button style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, padding: '0 3px', border: '1px solid #e8a0a0', color: '#c44', background: 'white', borderRadius: 3, cursor: 'pointer' }}
                                  onClick={() => delL3(l1, l2, l3)}>✕</button>
                              </div>
                              <L3InsertSlot l1={l1} l2={l2} afterL3={l3} moveL3Before={moveL3Before} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function L3InsertSlot({ l1, l2, position, firstL3, afterL3, moveL3Before }) {
  const [over, setOver] = useState(false)
  return (
    <div className={`ws-l3-insert ${over ? 'show' : ''}`}
      onDragOver={e => { if (e.dataTransfer.types.includes('text/plain')) { e.preventDefault(); setOver(true) } }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        setOver(false)
        const d = e.dataTransfer.getData('text/plain')
        if (!d?.startsWith('wsl3:')) return
        e.preventDefault(); e.stopPropagation()
        const [fl1, fl2, fl3] = d.replace('wsl3:', '').split('::')
        if (fl2 !== l2) return
        const target = afterL3 ? null : firstL3
        if (afterL3) {
          const { woo, setWoo, pushUndo, saveState } = useStore.getState()
          const row = woo.find(r => r[0] === fl1 && r[1] === fl2 && r[2] === fl3)
          if (!row) return
          const filtered = woo.filter(r => !(r[0] === fl1 && r[1] === fl2 && r[2] === fl3))
          const idx = filtered.findIndex(r => r[0] === l1 && r[1] === l2 && r[2] === afterL3)
          pushUndo()
          if (idx >= 0) { filtered.splice(idx + 1, 0, row); setWoo(filtered) } else setWoo([...filtered, row])
          saveState()
        } else {
          moveL3Before(fl1, fl2, fl3, firstL3)
        }
      }} />
  )
}
