import { useState } from 'react'
import { useStore } from '../store'
import Card from './Card'

export default function GalleryView() {
  const { gallery, filter, addSection, addCard, pushUndo, saveState, reorderSections, renameSection } = useStore()
  const [dragSectIdx, setDragSectIdx] = useState(null)
  const [editingSect, setEditingSect] = useState(null)
  const [editVal, setEditVal] = useState('')

  function visible(card) {
    if (filter === 'all') return true
    if (filter === 'miss') return card.type !== 'image'
    if (filter === 'done') return card.type === 'image'
  }

  function startRenameSection(si) {
    setEditingSect(si)
    setEditVal(gallery[si].section)
  }
  function commitRenameSection(si) {
    const v = editVal.trim() || gallery[si].section
    if (v !== gallery[si].section) { pushUndo(); renameSection(si, v); saveState() }
    setEditingSect(null)
  }

  return (
    <div>
      {gallery.map((sect, si) => {
        const order = sect.cards
          .map((c, i) => i)
          .sort((a, b) => (sect.cards[b].is_header ? 1 : 0) - (sect.cards[a].is_header ? 1 : 0))
        const visibleCards = order.filter(ci => visible(sect.cards[ci]))
        const sectionVisible = filter === 'all' || visibleCards.length > 0

        return (
          <div key={si} className="sect-block" id={`s${si}`}
            onDragOver={e => { if (dragSectIdx !== null && dragSectIdx !== si) { e.preventDefault(); e.currentTarget.style.borderTop = '3px solid #2E75B6' } }}
            onDragLeave={e => { e.currentTarget.style.borderTop = '' }}
            onDrop={e => {
              e.currentTarget.style.borderTop = ''
              if (dragSectIdx === null || dragSectIdx === si) return
              e.preventDefault()
              pushUndo(); reorderSections(dragSectIdx, si); saveState()
              setDragSectIdx(null)
            }}
            style={{ display: sectionVisible ? '' : 'none' }}>

            <h2 className="sect-hdr" draggable
              onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDragSectIdx(si); e.currentTarget.style.opacity = '0.5' }}
              onDragEnd={e => { e.currentTarget.style.opacity = ''; setDragSectIdx(null) }}>
              <span style={{ flex: 1 }}>
                {editingSect === si ? (
                  <input autoFocus value={editVal} className="sect-hdr"
                    style={{ fontSize: 17, fontWeight: 'bold', color: '#1F4E79', border: 'none', borderBottom: '2px solid #2E75B6', background: 'transparent', outline: 'none', fontFamily: 'Arial', width: 300 }}
                    onChange={e => setEditVal(e.target.value)}
                    onBlur={() => commitRenameSection(si)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRenameSection(si); if (e.key === 'Escape') setEditingSect(null) }} />
                ) : sect.section}
              </span>
              <button className="s-btn" onClick={() => startRenameSection(si)}>✏ Byt namn</button>
            </h2>

            <div className="grid">
              {order.map(ci => (
                <div key={ci} style={{ display: visible(sect.cards[ci]) ? '' : 'none' }}>
                  <Card card={sect.cards[ci]} si={si} ci={ci} />
                </div>
              ))}
              <div className="add-tile" onClick={() => {
                const name = prompt('Namn på ny kategori:')
                if (!name?.trim()) return
                const nm = name.trim()
                pushUndo()
                addCard(si, { type: 'missing', cat: nm, is_header: false, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(nm + ' cykel')}` })
                saveState()
              }}>
                <div className="plus">＋</div><div>Ny kategori</div>
              </div>
            </div>
          </div>
        )
      })}

      <button className="add-sect-btn" onClick={() => {
        const name = prompt('Namn på ny sektion:')
        if (!name?.trim()) return
        pushUndo(); addSection(name.trim()); saveState()
      }}>＋ Lägg till ny sektion</button>
    </div>
  )
}
