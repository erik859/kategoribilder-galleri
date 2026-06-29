import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCenter, pointerWithin,
  useSensor, useSensors, PointerSensor, MouseSensor
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

function s(bc, c) {
  return { fontSize: 10, padding: '1px 6px', border: `1px solid ${bc}`, color: c || bc, background: 'white', borderRadius: 3, cursor: 'pointer', flexShrink: 0 }
}

function overlayStyle(color, small) {
  return {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'white', border: `2px solid ${color}`, borderRadius: 8,
    padding: small ? '4px 10px' : '8px 14px',
    fontSize: small ? 11 : 13, fontWeight: 600, color,
    boxShadow: '0 8px 24px rgba(0,0,0,.2)', opacity: 0.95
  }
}

// Single L3 pill
function SortableL3Pill({ id, l1, l2, l3, findImg, onRenameL3, onDelL3 }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id, data: { type: 'l3', l1, l2, l3 }
  })
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(l3)
  const img = findImg(l3)
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, position: 'relative',
        background: 'white', border: `1px ${img ? 'solid #27AE60' : 'dashed #f5c07a'}`,
        borderRadius: 8, padding: '4px 24px 4px 4px', fontSize: 11, minWidth: 110,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,.15)' : 'none'
      }}>
        <span {...listeners} {...attributes}
          style={{ cursor: 'grab', color: '#bbb', fontSize: 13, flexShrink: 0, userSelect: 'none' }}
          title="Dra">&#11296;</span>
        {img
          ? <img src={img} style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
          : <div style={{ width: 26, height: 26, background: '#f0f0f0', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>?</div>
        }
        {editing
          ? <input autoFocus value={val} onChange={e => setVal(e.target.value)}
              style={{ flex: 1, minWidth: 60, fontSize: 11, border: 'none', borderBottom: '1px solid #2E75B6', outline: 'none', background: 'transparent' }}
              onBlur={() => { setEditing(false); onRenameL3(l3, val.trim() || l3) }}
              onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onRenameL3(l3, val.trim() || l3) } if (e.key === 'Escape') setEditing(false) }} />
          : <span style={{ cursor: 'text', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              onDoubleClick={() => { setVal(l3); setEditing(true) }}>{l3}</span>
        }
        <button onClick={() => onDelL3(l1, l2, l3)}
          style={{ position: 'absolute', top: 2, right: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 10, lineHeight: 1, padding: 0 }}
          onMouseEnter={e => e.target.style.color = '#c44'} onMouseLeave={e => e.target.style.color = '#ddd'}>&#x2715;</button>
      </div>
    </div>
  )
}

// L2 box
function SortableL2Box({ id, l1, l2, cats, wsFilter, findImg, onRenameL2, onDelL2, onAddL3, onRenameL3, onDelL3, isL3DropTarget }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id, data: { type: 'l2', l1, l2 }
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(l2)
  const l2img = findImg(l2)
  const filtered = cats.filter(l3 => {
    if (!l3) return false
    const img = findImg(l3)
    if (wsFilter === 'has') return !!img
    if (wsFilter === 'miss') return !img
    return true
  })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, marginBottom: 6 }}>
      <div style={{
        background: 'white', borderRadius: 8, overflow: 'hidden',
        border: isL3DropTarget ? '2px dashed #2E75B6' : '1px solid #d0dce8',
        boxShadow: '0 1px 3px rgba(0,0,0,.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#f7f9fb' }}
          onClick={e => { if (!editing && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') setOpen(o => !o) }}>
          <span {...listeners} {...attributes}
            style={{ cursor: 'grab', color: '#bbb', fontSize: 16, flexShrink: 0, userSelect: 'none', padding: '0 4px' }}
            onClick={e => e.stopPropagation()}>&#11296;</span>
          {l2img
            ? <img src={l2img} style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
            : <div style={{ width: 24, height: 24, background: '#e8edf2', borderRadius: 4, flexShrink: 0 }} />
          }
          {editing
            ? <input autoFocus value={val} onChange={e => setVal(e.target.value)}
                style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1F4E79', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none' }}
                onBlur={() => { setEditing(false); onRenameL2(l2, val.trim() || l2) }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onRenameL2(l2, val.trim() || l2) } if (e.key === 'Escape') setEditing(false) }} />
            : <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1F4E79', cursor: 'text' }}
                onDoubleClick={e => { e.stopPropagation(); setVal(l2); setEditing(true) }}>{l2}</span>
          }
          <span style={{ fontSize: 10, color: '#aaa', flexShrink: 0 }}>{cats.length}</span>
          <button onClick={e => { e.stopPropagation(); onAddL3(l1, l2) }}
            style={s('#27AE60')} title="Lagg till kategori">+</button>
          <button onClick={e => { e.stopPropagation(); onDelL2(l1, l2) }}
            style={s('#e8a0a0', '#c44')} title="Ta bort">x</button>
          <span style={{ fontSize: 11, color: '#999', marginLeft: 2 }}>{open ? 'A' : 'V'}</span>
        </div>
        {open && (
          <div data-l2-drop={`${l1}::${l2}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px', minHeight: 44, background: isL3DropTarget ? '#f0f7ff' : 'transparent', transition: 'background .15s' }}>
            <SortableContext items={filtered.map(l3 => `${l1}::${l2}::${l3}`)} strategy={rectSortingStrategy}>
              {filtered.map(l3 => (
                <SortableL3Pill key={l3} id={`${l1}::${l2}::${l3}`}
                  l1={l1} l2={l2} l3={l3} findImg={findImg}
                  onRenameL3={onRenameL3} onDelL3={onDelL3} />
              ))}
            </SortableContext>
            {filtered.length === 0 && (
              <span style={{ fontSize: 11, color: '#ccc', alignSelf: 'center' }}>Inga kategorier</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Main WebshopView
export default function WebshopView() {
  const { gallery, woo, setWoo, pushUndo, saveState, renameWooL3, deleteWooL3 } = useStore()
  const [wsFilter, setWsFilter] = useState('all')
  const [openL1, setOpenL1] = useState({})
  const [activeDrag, setActiveDrag] = useState(null)
  const [l3DropTarget, setL3DropTarget] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  )

  const tree = buildWooTree(woo)
  const l1Keys = Object.keys(tree)

  function findImg(catName) {
    const n = catName.toLowerCase().trim()
    for (const sect of gallery) for (const c of sect.cards) {
      if (c.type === 'image' && c.cat?.toLowerCase().trim() === n)
        return c.manualUrl || (c.drive_id ? `https://lh3.googleusercontent.com/d/${c.drive_id}=w60` : null)
    }
    return null
  }

  const renameL1 = (old, nv) => { if (nv !== old) { pushUndo(); setWoo(woo.map(r => r[0]===old?[nv,r[1],r[2]]:r)); saveState() } }
  const renameL2 = (old, nv) => { if (nv !== old) { pushUndo(); setWoo(woo.map(r => r[1]===old?[r[0],nv,r[2]]:r)); saveState() } }
  const renameL3 = (old, nv) => { if (nv === old) return; pushUndo(); renameWooL3(old, nv); saveState() }
  const delL1 = (l1) => { const n=woo.filter(r=>r[0]===l1).length; if (!confirm(`Ta bort hela huvudkategorin "${l1}" med alla underkategorier (${n} rader)?`)) return; pushUndo(); setWoo(woo.filter(r=>r[0]!==l1)); saveState() }
  const delL2 = (l1, l2) => { if (!confirm(`Ta bort "${l2}"?`)) return; pushUndo(); setWoo(woo.filter(r=>!(r[0]===l1&&r[1]===l2))); saveState() }
  const delL3 = (l1, l2, l3) => { if (!confirm(`Ta bort "${l3}"?`)) return; pushUndo(); deleteWooL3(l1, l2, l3); saveState() }
  const addL2 = (l1) => { const n=prompt(`Ny underkategori under ${l1}:`); if(n?.trim()){pushUndo();setWoo([...woo,[l1,n.trim(),'']]);saveState()} }
  const addL3 = (l1,l2) => { const n=prompt(`Ny kategori under ${l2}:`); if(n?.trim()){pushUndo();setWoo([...woo,[l1,l2,n.trim()]]);saveState()} }

  function handleDragStart(e) { setActiveDrag(e.active.data.current) }

  function handleDragOver(e) {
    const { over, active } = e
    const activeData = active?.data?.current
    if (activeData?.type === 'l3' && over) {
      const overData = over.data?.current
      if (overData?.type === 'l3') setL3DropTarget(`${overData.l1}::${overData.l2}`)
      else if (overData?.type === 'l2') setL3DropTarget(`${overData.l1}::${overData.l2}`)
      else setL3DropTarget(null)
    } else setL3DropTarget(null)
  }

  function handleDragEnd(e) {
    const { active, over } = e
    setActiveDrag(null); setL3DropTarget(null)
    if (!over || active.id === over.id) return
    const ad = active.data.current, od = over.data.current

    if (ad?.type === 'l1' && od?.type === 'l1') {
      const fi = l1Keys.indexOf(ad.l1), ti = l1Keys.indexOf(od.l1)
      if (fi === ti) return
      const reordered = arrayMove(l1Keys, fi, ti)
      pushUndo()
      setWoo(reordered.flatMap(l1 => woo.filter(r => r[0] === l1))); saveState()
      return
    }

    if (ad?.type === 'l2') {
      const fromL1 = ad.l1, l2name = ad.l2, toL1 = od?.l1 || fromL1
      if (fromL1 === toL1 && od?.type === 'l2' && od.l2 !== l2name) {
        const l2keys = Object.keys(tree[fromL1])
        const fi = l2keys.indexOf(l2name), ti = l2keys.indexOf(od.l2)
        const reordered = arrayMove(l2keys, fi, ti)
        pushUndo()
        const otherRows = woo.filter(r => r[0] !== fromL1)
        const l1Rows = reordered.flatMap(l2 => woo.filter(r => r[0] === fromL1 && r[1] === l2))
        setWoo([...otherRows, ...l1Rows]); saveState()
      } else if (toL1 !== fromL1) {
        pushUndo()
        setWoo(woo.map(r => r[0]===fromL1&&r[1]===l2name?[toL1,r[1],r[2]]:r)); saveState()
      }
      return
    }

    if (ad?.type === 'l3') {
      const fromL1=ad.l1, fromL2=ad.l2, fromL3=ad.l3
      const toL1=od?.l1||fromL1, toL2=od?.l2||fromL2, toL3=od?.l3
      if (fromL1===toL1 && fromL2===toL2 && toL3 && toL3!==fromL3) {
        pushUndo()
        const row = woo.find(r=>r[0]===fromL1&&r[1]===fromL2&&r[2]===fromL3)
        let filtered = woo.filter(r=>!(r[0]===fromL1&&r[1]===fromL2&&r[2]===fromL3))
        const ti = filtered.findIndex(r=>r[0]===toL1&&r[1]===toL2&&r[2]===toL3)
        if (ti>=0) filtered.splice(ti,0,row); else filtered.push(row)
        setWoo(filtered); saveState()
      } else if (fromL2 !== toL2) {
        pushUndo()
        setWoo(woo.map(r=>r[0]===fromL1&&r[1]===fromL2&&r[2]===fromL3?[toL1,toL2,r[2]]:r)); saveState()
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['all','Alla'],['miss','Saknar bild'],['has','Har bild']].map(([f,label]) => (
          <button key={f} onClick={() => setWsFilter(f)}
            style={{ padding:'5px 14px', fontSize:12, cursor:'pointer', border:'1px solid #ccc', background: wsFilter===f?'#1F4E79':'white', color: wsFilter===f?'white':'#888', borderRadius:6 }}>
            {label}
          </button>
        ))}
        <span style={{ fontSize:11, color:'#aaa', alignSelf:'center', marginLeft:8 }}>Dra &#11296; for att flytta</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin}
        modifiers={[restrictToWindowEdges]}
        onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>

        <SortableContext items={l1Keys.map(l1 => `l1::${l1}`)} strategy={verticalListSortingStrategy}>
          {l1Keys.map(l1 => {
            const l2keys = Object.keys(tree[l1])
            const total = l2keys.reduce((n,l2)=>n+tree[l1][l2].length,0)
            const has = l2keys.reduce((n,l2)=>n+tree[l1][l2].filter(l3=>findImg(l3)).length,0)
            const pct = total ? Math.round(has/total*100) : 0
            const isOpen = openL1[l1]
            const isL2DropHere = activeDrag?.type==='l2' && activeDrag.l1!==l1
            return (
              <SortableL1 key={l1} id={`l1::${l1}`} l1={l1} isL2DropHere={isL2DropHere}
                isOpen={isOpen} pct={pct} has={has} total={total} l2keys={l2keys}
                onToggle={() => setOpenL1(p=>({...p,[l1]:!p[l1]}))}
                onAddL2={() => addL2(l1)} onRenameL1={nv => renameL1(l1, nv)} onDelL1={() => delL1(l1)}>
                {l2keys.map(l2 => (
                  <SortableL2Box key={`${l1}::${l2}`} id={`${l1}::${l2}`}
                    l1={l1} l2={l2} cats={tree[l1][l2]} wsFilter={wsFilter}
                    findImg={findImg} onRenameL2={renameL2} onDelL2={delL2}
                    onAddL3={addL3} onRenameL3={renameL3} onDelL3={delL3}
                    isL3DropTarget={l3DropTarget===`${l1}::${l2}`} />
                ))}
              </SortableL1>
            )
          })}
        </SortableContext>

        <DragOverlay modifiers={[restrictToWindowEdges]}>
          {activeDrag?.type==='l1' && <div style={overlayStyle('#1F4E79')}>&#11296; {activeDrag.l1}</div>}
          {activeDrag?.type==='l2' && <div style={overlayStyle('#2E75B6')}>&#11296; {activeDrag.l2}</div>}
          {activeDrag?.type==='l3' && <div style={overlayStyle('#27AE60', true)}>
            <span style={{color:'#bbb'}}>&#11296;</span>
            {findImg(activeDrag.l3) && <img src={findImg(activeDrag.l3)} style={{width:24,height:24,objectFit:'cover',borderRadius:4}} />}
            {activeDrag.l3}
          </div>}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function SortableL1({ id, l1, isL2DropHere, isOpen, pct, has, total, l2keys, onToggle, onAddL2, onRenameL1, onDelL1, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, data: { type: 'l1', l1 } })
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(l1)
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging?0.5:1, marginBottom:12 }}>
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
        background: isL2DropHere?'#eef5ff':'#f0f4f8', borderRadius:8,
        border: isL2DropHere?'2px dashed #2E75B6':'1px solid #d0dce8', cursor:'pointer'
      }} onClick={e => { if(!editing&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='INPUT') onToggle() }}>
        <span {...listeners} {...attributes}
          style={{cursor:'grab',color:'#bbb',fontSize:16,flexShrink:0,userSelect:'none'}}
          onClick={e=>e.stopPropagation()}>&#11296;</span>
        <span style={{fontSize:10,color:'#999',transition:'transform .15s',display:'inline-block',transform:isOpen?'rotate(90deg)':''}}>&#9658;</span>
        {editing
          ? <input autoFocus value={val} onChange={e=>setVal(e.target.value)}
              style={{flex:1,fontSize:16,fontWeight:'bold',color:'#1F4E79',border:'none',borderBottom:'2px solid #2E75B6',background:'transparent',outline:'none'}}
              onBlur={()=>{setEditing(false);onRenameL1(val.trim()||l1)}} onClick={e=>e.stopPropagation()}
              onKeyDown={e=>{if(e.key==='Enter'){setEditing(false);onRenameL1(val.trim()||l1)}if(e.key==='Escape')setEditing(false)}} />
          : <span style={{flex:1,fontSize:16,fontWeight:'bold',color:'#1F4E79',cursor:'text'}}
              onDoubleClick={e=>{e.stopPropagation();setVal(l1);setEditing(true)}}>{l1}</span>
        }
        <span style={{fontSize:11,color:'#666'}}>{has}/{total} bilder</span>
        <span style={{fontSize:11,background:pct>=80?'#d4edda':pct>=40?'#fff3cd':'#f8d7da',color:pct>=80?'#155724':pct>=40?'#856404':'#721c24',padding:'1px 8px',borderRadius:10}}>{pct}%</span>
        <button style={{fontSize:10,padding:'1px 7px',border:'1px solid #27AE60',color:'#27AE60',background:'white',borderRadius:3,cursor:'pointer'}}
          onClick={e=>{e.stopPropagation();onAddL2()}}>+ Lagg till</button>
        <button style={{fontSize:12,padding:'1px 7px',border:'1px solid #e8a0a0',color:'#c44',background:'white',borderRadius:3,cursor:'pointer',flexShrink:0}}
          onClick={e=>{e.stopPropagation();onDelL1()}}>&#128465;</button>
      </div>
      {isOpen && (
        <div style={{paddingLeft:16,borderLeft:'3px solid #2E75B6',marginLeft:7,marginTop:4}}>
          <SortableContext items={l2keys.map(l2=>`${l1}::${l2}`)} strategy={verticalListSortingStrategy}>
            {children}
          </SortableContext>
        </div>
      )}
    </div>
  )
      }
