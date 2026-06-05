import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, pointerWithin,
  useSensor, useSensors, PointerSensor
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, rectSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useStore } from '../store'
import { buildWooTree } from '../utils/helpers'

// ── Sortable L2 box ──────────────────────────────────────────────────────────
function SortableL2Box({ id, l1, l2, cats, wsFilter, findImg, onRenameL2, onDelL2, onAddL3, onRenameL3, onDelL3, wooForL2 }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id, data: { type: 'l2', l1, l2 } })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(l2)
  const l2img = findImg(l2)

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        background: 'white', border: isOver ? '2px dashed #2E75B6' : '1px solid #d0dce8',
        borderRadius: 8, marginBottom: 6, overflow: 'hidden',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,.15)' : '0 1px 3px rgba(0,0,0,.08)'
      }}>
        {/* L2 header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#f7f9fb', borderBottom: open ? '1px solid #e0e8f0' : 'none' }}>
          <span {...listeners} {...attributes} style={{ cursor: 'grab', color: '#bbb', fontSize: 16, flexShrink: 0 }} title="Dra för att flytta">⠿</span>
          {l2img
            ? <img src={l2img} style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
            : <div style={{ width: 24, height: 24, background: '#e8edf2', borderRadius: 4, flexShrink: 0 }} />
          }
          {editing
            ? <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1F4E79', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none' }}
                onBlur={() => { setEditing(false); onRenameL2(l2, editVal.trim() || l2) }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onRenameL2(l2, editVal.trim() || l2) } if (e.key === 'Escape') setEditing(false) }} />
            : <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1F4E79', cursor: 'text' }} onDoubleClick={() => { setEditVal(l2); setEditing(true) }}>{l2}</span>
          }
          <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>{cats.length} kat.</span>
          <button onClick={() => onAddL3(l1, l2)} style={btnStyle('#27AE60')} title="Lägg till kategori">＋</button>
          <button onClick={() => onDelL2(l1, l2)} style={btnStyle('#e8a0a0', '#c44')} title="Ta bort">✕</button>
          {cats.length > 0 && (
            <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12, padding: '0 2px' }}>
              {open ? '▲' : '▼'}
            </button>
          )}
        </div>

        {/* L3 sortable pills */}
        {open && cats.length > 0 && (
          <SortableL3List l1={l1} l2={l2} cats={cats} wsFilter={wsFilter} findImg={findImg} onRenameL3={onRenameL3} onDelL3={onDelL3} />
        )}
      </div>
    </div>
  )
}

// ── Sortable L3 list ─────────────────────────────────────────────────────────
function SortableL3List({ l1, l2, cats, wsFilter, findImg, onRenameL3, onDelL3 }) {
  const { setWoo, pushUndo, saveState, woo } = useStore()
  const filtered = cats.filter(l3 => {
    if (!l3) return false
    const img = findImg(l3)
    if (wsFilter === 'has') return !!img
    if (wsFilter === 'miss') return !img
    return true
  })

  function handleL3DragEnd(e) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const fromL3 = String(active.id).replace(`${l1}::${l2}::`, '')
    const toL3 = String(over.id).replace(`${l1}::${l2}::`, '')
    const fromIdx = cats.indexOf(fromL3)
    const toIdx = cats.indexOf(toL3)
    if (fromIdx < 0 || toIdx < 0) return
    const newCats = arrayMove(cats, fromIdx, toIdx)
    pushUndo()
    const newWoo = woo.filter(r => !(r[0] === l1 && r[1] === l2))
    const insertIdx = newWoo.findIndex(r => r[0] === l1 && r[1] > l2) // approximate
    const newRows = newCats.map(l3 => [l1, l2, l3])
    // Re-insert in original position order
    const firstIdx = woo.findIndex(r => r[0] === l1 && r[1] === l2)
    const rebuilt = [...newWoo]
    newRows.forEach((r, i) => rebuilt.splice(Math.min(firstIdx + i, rebuilt.length), 0, r))
    setWoo(rebuilt)
    saveState()
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const ids = filtered.map(l3 => `${l1}::${l2}::${l3}`)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleL3DragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px' }}>
          {filtered.map(l3 => <SortableL3Pill key={l3} id={`${l1}::${l2}::${l3}`} l1={l1} l2={l2} l3={l3} findImg={findImg} onRenameL3={onRenameL3} onDelL3={onDelL3} />)}
        </div>
      </SortableContext>
    </DndContext>
  )
}

// ── Sortable L3 pill ─────────────────────────────────────────────────────────
function SortableL3Pill({ id, l1, l2, l3, findImg, onRenameL3, onDelL3 }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(l3)
  const img = findImg(l3)

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'white', border: `1px solid ${img ? '#27AE60' : '#f5c07a'}`,
        borderStyle: img ? 'solid' : 'dashed', borderRadius: 8,
        padding: '3px 8px 3px 4px', fontSize: 11, position: 'relative', minWidth: 120
      }}>
        <span {...listeners} {...attributes} style={{ cursor: 'grab', color: '#ccc', fontSize: 12 }} title="Dra för att sortera">⠿</span>
        {img ? <img src={img} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} /> : <div style={{ width: 28, height: 28, background: '#f0f0f0', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 14 }}>?</div>}
        {editing
          ? <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
              style={{ fontSize: 11, border: 'none', borderBottom: '1px solid #2E75B6', outline: 'none', background: 'transparent', minWidth: 60 }}
              onBlur={() => { setEditing(false); onRenameL3(l3, editVal.trim() || l3) }}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onRenameL3(l3, editVal.trim() || l3) } if (e.key === 'Escape') setEditing(false) }} />
          : <span style={{ cursor: 'text' }} onDoubleClick={() => { setEditVal(l3); setEditing(true) }}>{l3}</span>
        }
        <button onClick={() => onDelL3(l1, l2, l3)} style={{ position: 'absolute', top: 1, right: 1, background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 10, padding: '0 2px', lineHeight: 1 }}
          onMouseEnter={e => e.target.style.color = '#c44'} onMouseLeave={e => e.target.style.color = '#ddd'}>✕</button>
      </div>
    </div>
  )
}

function btnStyle(borderColor, color) {
  return { fontSize: 10, padding: '1px 6px', border: `1px solid ${borderColor}`, color: color || borderColor, background: 'white', borderRadius: 3, cursor: 'pointer', flexShrink: 0 }
}

// ── Main WebshopView ─────────────────────────────────────────────────────────
export default function WebshopView() {
  const { gallery, woo, setWoo, pushUndo, saveState } = useStore()
  const [wsFilter, setWsFilter] = useState('all')
  const [openL1, setOpenL1] = useState({})
  const [activeL2, setActiveL2] = useState(null) // { l1, l2 }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
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
  function delL2(l1, l2) { if (!confirm(`Ta bort "${l2}"?`)) return; pushUndo(); setWoo(woo.filter(r => !(r[0] === l1 && r[1] === l2))); saveState() }
  function delL3(l1, l2, l3) { if (!confirm(`Ta bort "${l3}"?`)) return; pushUndo(); setWoo(woo.filter(r => !(r[0] === l1 && r[1] === l2 && r[2] === l3))); saveState() }
  function addL2(l1) { const n = prompt(`Ny underkategori under ${l1}:`); if (n?.trim()) { pushUndo(); setWoo([...woo, [l1, n.trim(), '']]); saveState() } }
  function addL3(l1, l2) { const n = prompt(`Ny kategori under ${l2}:`); if (n?.trim()) { pushUndo(); setWoo([...woo, [l1, l2, n.trim()]]); saveState() } }

  function handleL2DragStart(e) {
    const data = e.active.data.current
    if (data?.type === 'l2') setActiveL2({ l1: data.l1, l2: data.l2 })
  }

  function handleL2DragEnd(e) {
    const { active, over } = e
    setActiveL2(null)
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData || activeData.type !== 'l2') return

    const fromL1 = activeData.l1, l2Name = activeData.l2
    const toL1 = overData?.l1 || String(over.id).replace('l1::', '')

    if (fromL1 === toL1) {
      // Reorder within same L1
      const l2keys = Object.keys(tree[fromL1])
      const fromIdx = l2keys.indexOf(l2Name)
      const toIdx = l2keys.indexOf(overData?.l2 || l2Name)
      if (fromIdx !== toIdx && toIdx >= 0) {
        const reordered = arrayMove(l2keys, fromIdx, toIdx)
        pushUndo()
        // Rebuild woo maintaining order
        const otherRows = woo.filter(r => r[0] !== fromL1)
        const l1Rows = reordered.flatMap(l2 => woo.filter(r => r[0] === fromL1 && r[1] === l2))
        setWoo([...otherRows, ...l1Rows])
        saveState()
      }
    } else {
      // Move to different L1
      pushUndo()
      setWoo(woo.map(r => r[0] === fromL1 && r[1] === l2Name ? [toL1, r[1], r[2]] : r))
      saveState()
    }
  }

  return (
    <div>
      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['all','Alla'],['miss','Saknar bild'],['has','Har bild']].map(([f, label]) => (
          <button key={f} onClick={() => setWsFilter(f)}
            style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid #ccc', background: wsFilter === f ? '#1F4E79' : 'white', color: wsFilter === f ? 'white' : '#888', borderRadius: 6 }}>
            {label}
          </button>
        ))}
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} modifiers={[restrictToWindowEdges]} onDragStart={handleL2DragStart} onDragEnd={handleL2DragEnd}>
        {Object.keys(tree).map(l1 => {
          const l2keys = Object.keys(tree[l1])
          const total = l2keys.reduce((n, l2) => n + tree[l1][l2].length, 0)
          const has = l2keys.reduce((n, l2) => n + tree[l1][l2].filter(l3 => findImg(l3)).length, 0)
          const pct = total ? Math.round(has / total * 100) : 0
          const isOpen = openL1[l1]
          const l2ids = l2keys.map(l2 => `${l1}::${l2}`)

          return (
            <div key={l1} style={{ marginBottom: 12 }}>
              {/* L1 header */}
              <div id={`l1::${l1}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', background: '#f0f4f8', borderRadius: 8,
                cursor: 'pointer', border: '1px solid #d0dce8',
                outline: activeL2 && activeL2.l1 !== l1 ? '2px dashed #2E75B6' : 'none'
              }}
                onClick={() => setOpenL1(p => ({...p, [l1]: !p[l1]}))}>
                <span style={{ fontSize: 10, color: '#999', transition: 'transform .15s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : '' }}>▶</span>
                <L1InlineEdit value={l1} onSave={nv => renameL1(l1, nv)} />
                <span style={{ fontSize: 11, color: '#666', fontWeight: 'normal', marginLeft: 'auto' }}>{has}/{total} bilder</span>
                <span style={{ fontSize: 11, background: pct >= 80 ? '#d4edda' : pct >= 40 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 40 ? '#856404' : '#721c24', padding: '1px 8px', borderRadius: 10 }}>{pct}%</span>
                <button style={btnStyle('#27AE60')} onClick={e => { e.stopPropagation(); addL2(l1) }}>＋ Lägg till</button>
              </div>

              {/* L2 sortable boxes */}
              {isOpen && (
                <div style={{ paddingLeft: 16, borderLeft: '3px solid #2E75B6', marginLeft: 7, marginTop: 4 }}>
                  <SortableContext items={l2ids} strategy={verticalListSortingStrategy}>
                    {l2keys.map(l2 => (
                      <SortableL2Box key={`${l1}::${l2}`} id={`${l1}::${l2}`}
                        l1={l1} l2={l2} cats={tree[l1][l2]} wsFilter={wsFilter}
                        findImg={findImg} onRenameL2={renameL2} onDelL2={delL2}
                        onAddL3={addL3} onRenameL3={renameL3} onDelL3={delL3} />
                    ))}
                  </SortableContext>
                </div>
              )}
            </div>
          )
        })}

        <DragOverlay modifiers={[restrictToWindowEdges]}>
          {activeL2 && (
            <div style={{ background: 'white', border: '2px solid #2E75B6', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: '#1F4E79', boxShadow: '0 8px 24px rgba(0,0,0,.2)', opacity: 0.9 }}>
              ⠿ {activeL2.l2}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function L1InlineEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)
  if (editing) return (
    <input autoFocus value={val} onChange={e => setVal(e.target.value)}
      style={{ fontSize: 16, fontWeight: 'bold', color: '#1F4E79', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none', flex: 1 }}
      onBlur={() => { setEditing(false); onSave(val.trim() || value) }}
      onClick={e => e.stopPropagation()}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onSave(val.trim() || value) } if (e.key === 'Escape') setEditing(false) }} />
  )
  return <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1F4E79', flex: 1, cursor: 'text' }} onDoubleClick={e => { e.stopPropagation(); setVal(value); setEditing(true) }}>{value}</span>
}
