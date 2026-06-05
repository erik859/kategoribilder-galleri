import { useState } from 'react'
import {
  DndContext, closestCenter, DragOverlay,
  PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, rectSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store'
import Card from './Card'

// Sortable wrapper for a card
function SortableCard({ card, si, ci, id }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    outline: isOver ? '3px dashed #2E75B6' : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <Card card={card} si={si} ci={ci} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  )
}

// Sortable wrapper for a section
function SortableSection({ sect, si, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({ id: `sect-${si}` })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderTop: isOver ? '3px solid #2E75B6' : '3px solid transparent',
  }
  return (
    <div ref={setNodeRef} style={style} className="sect-block" id={`s${si}`}>
      {children(listeners, attributes)}
    </div>
  )
}

export default function GalleryView() {
  const { gallery, filter, addSection, addCard, pushUndo, saveState, setGallery, renameSection } = useStore()
  const [activeDrag, setActiveDrag] = useState(null)
  const [editingSect, setEditingSect] = useState(null)
  const [editVal, setEditVal] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function visible(card) {
    if (filter === 'all') return true
    if (filter === 'miss') return card.type !== 'image'
    if (filter === 'done') return card.type === 'image'
  }

  function handleDragStart(e) { setActiveDrag(e.active.id) }

  function handleDragEnd(e) {
    setActiveDrag(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    // Section reorder
    if (String(active.id).startsWith('sect-') && String(over.id).startsWith('sect-')) {
      const fromIdx = parseInt(active.id.replace('sect-', ''))
      const toIdx = parseInt(over.id.replace('sect-', ''))
      pushUndo()
      setGallery(arrayMove(gallery, fromIdx, toIdx))
      saveState()
      return
    }

    // Card reorder within section
    const [, siStr, ciStr] = String(active.id).split('-')
    const [, toSiStr, toCiStr] = String(over.id).split('-')
    const si = parseInt(siStr), ci = parseInt(ciStr)
    const toSi = parseInt(toSiStr), toCi = parseInt(toCiStr)

    if (si === toSi && ci !== toCi) {
      pushUndo()
      const newGallery = gallery.map((s, i) => {
        if (i !== si) return s
        return { ...s, cards: arrayMove(s.cards, ci, toCi) }
      })
      setGallery(newGallery)
      saveState()
    }
  }

  function startRenameSection(si) { setEditingSect(si); setEditVal(gallery[si].section) }
  function commitRenameSection(si) {
    const v = editVal.trim() || gallery[si].section
    if (v !== gallery[si].section) { pushUndo(); renameSection(si, v); saveState() }
    setEditingSect(null)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SortableContext items={gallery.map((_, si) => `sect-${si}`)} strategy={verticalListSortingStrategy}>
        {gallery.map((sect, si) => {
          const order = sect.cards.map((c, i) => i).sort((a, b) => (sect.cards[b].is_header ? 1 : 0) - (sect.cards[a].is_header ? 1 : 0))
          const sectionVisible = filter === 'all' || order.some(ci => visible(sect.cards[ci]))

          return (
            <SortableSection key={si} sect={sect} si={si}>
              {(listeners, attributes) => (
                <>
                  <h2 className="sect-hdr">
                    <span {...listeners} {...attributes} style={{ cursor: 'grab', color: '#ccc', fontSize: 18, padding: '0 6px 0 0', userSelect: 'none' }} title="Dra för att flytta sektion">⠿</span>
                    <span style={{ flex: 1 }}>
                      {editingSect === si ? (
                        <input autoFocus value={editVal}
                          style={{ fontSize: 17, fontWeight: 'bold', color: '#1F4E79', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none', fontFamily: 'Arial', width: 300 }}
                          onChange={e => setEditVal(e.target.value)}
                          onBlur={() => commitRenameSection(si)}
                          onKeyDown={e => { if (e.key === 'Enter') commitRenameSection(si); if (e.key === 'Escape') setEditingSect(null) }} />
                      ) : sect.section}
                    </span>
                    <button className="s-btn" onClick={() => startRenameSection(si)}>✏ Byt namn</button>
                  </h2>

                  {sectionVisible && (
                    <SortableContext items={order.map(ci => `card-${si}-${ci}`)} strategy={rectSortingStrategy}>
                      <div className="grid">
                        {order.filter(ci => visible(sect.cards[ci])).map(ci => (
                          <SortableCard key={`card-${si}-${ci}`} id={`card-${si}-${ci}`} card={sect.cards[ci]} si={si} ci={ci} />
                        ))}
                        <div className="add-tile" onClick={() => {
                          const name = prompt('Namn på ny kategori:')
                          if (!name?.trim()) return
                          pushUndo()
                          addCard(si, { type: 'missing', cat: name.trim(), is_header: false, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name.trim() + ' cykel')}` })
                          saveState()
                        }}>
                          <div className="plus">＋</div><div>Ny kategori</div>
                        </div>
                      </div>
                    </SortableContext>
                  )}
                </>
              )}
            </SortableSection>
          )
        })}
      </SortableContext>

      <DragOverlay>
        {activeDrag && !String(activeDrag).startsWith('sect-') && (() => {
          const [, siStr, ciStr] = String(activeDrag).split('-')
          const si = parseInt(siStr), ci = parseInt(ciStr)
          const card = gallery[si]?.cards[ci]
          return card ? <div style={{ opacity: 0.8, transform: 'rotate(2deg)', boxShadow: '0 8px 24px rgba(0,0,0,.3)', borderRadius: 8, background: 'white', width: 190 }}><Card card={card} si={si} ci={ci} /></div> : null
        })()}
      </DragOverlay>

      <button className="add-sect-btn" onClick={() => {
        const name = prompt('Namn på ny sektion:')
        if (!name?.trim()) return
        pushUndo(); addSection(name.trim()); saveState()
      }}>＋ Lägg till ny sektion</button>
    </DndContext>
  )
}
