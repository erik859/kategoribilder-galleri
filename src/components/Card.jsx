import { useState, useRef } from 'react'
import { useStore } from '../store'
import { catToFilename } from '../utils/helpers'
import ImageModal from './modals/ImageModal'
import MoveModal from './modals/MoveModal'

export default function Card({ card, si, ci }) {
  const { updateCard, deleteCard, toggleHeader, pushUndo, saveState, gallery } = useStore()
  const [showImageModal, setShowImageModal] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const dragDepthRef = useRef(0)

  const isHeader = card.is_header
  const isMissing = card.type !== 'image'
  const imgSrc = card.manualUrl || (card.drive_id ? `https://lh3.googleusercontent.com/d/${card.drive_id}=w300` : '')
  const url = card.manualUrl || (card.drive_id ? `https://drive.google.com/file/d/${card.drive_id}/view` : '')

  function startEdit() {
    setEditVal(card.cat === '(huvud)' ? '(huvud)' : card.cat)
    setEditing(true)
  }
  function commitEdit() {
    const v = editVal.trim() || card.cat
    if (v !== card.cat) {
      pushUndo(); updateCard(si, ci, { cat: v }); saveState()
    }
    setEditing(false)
  }

  // Drag & drop file onto card
  function handleDragEnter(e) {
    e.preventDefault(); e.stopPropagation()
    dragDepthRef.current++
    if (dragDepthRef.current === 1) setDragOver(true)
  }
  function handleDragLeave(e) {
    e.stopPropagation()
    dragDepthRef.current--
    if (dragDepthRef.current === 0) setDragOver(false)
  }
  function handleDragOver(e) { e.preventDefault(); e.stopPropagation() }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation()
    dragDepthRef.current = 0; setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => {
        pushUndo()
        updateCard(si, ci, {
          type: 'image', manualUrl: ev.target.result,
          fn: card.fnCustom ? card.fn : catToFilename(card.cat),
          seoAlt: card.cat + ' – ' + gallery[si].section + ' cykel'
        })
        saveState()
      }
      reader.readAsDataURL(file)
      return
    }
    const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list')
    if (url?.startsWith('http') || url?.startsWith('data:')) {
      setShowImageModal(true)
    }
  }

  const cls = ['card', isHeader ? 'hdr' : '', isMissing ? 'miss' : '', card.cat === 'Granska manuellt' ? 'unk' : '', dragOver ? 'drag-over' : ''].filter(Boolean).join(' ')

  return (
    <>
      <div className={cls}
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        onDragOver={handleDragOver} onDrop={handleDrop}>

        {!isMissing ? (
          <div className="img-area" onClick={() => setShowImageModal(true)}>
            <img src={imgSrc} alt={card.seoAlt || card.cat}
              onError={e => { e.target.parentNode.className = 'ph'; e.target.parentNode.innerHTML = '<div class="plus">⚠</div><div>Ej tillgänglig</div>' }} />
            <div className="ovl">
              <button onClick={ev => { ev.stopPropagation(); window.open(url, '_blank') }}>↗ Öppna</button>
              <button onClick={ev => { ev.stopPropagation(); setShowImageModal(true) }}>✏ Redigera</button>
            </div>
          </div>
        ) : (
          <div className="ph" onClick={() => setShowImageModal(true)}>
            <div className="plus">＋</div>
            <div>Lägg till bild</div>
          </div>
        )}

        <div className="card-info">
          {editing ? (
            <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
              style={{ width: '100%', fontSize: 11, fontWeight: 'bold', color: '#1F4E79', border: 'none', borderBottom: '1px dashed #2E75B6', background: 'transparent', outline: 'none', fontFamily: 'Arial' }} />
          ) : (
            <div className="card-cat" title="Dubbelklicka för att byta namn" onDoubleClick={startEdit}>
              {card.cat === '(huvud)' ? <em style={{ color: '#888' }}>(huvud)</em> : card.cat}
            </div>
          )}
          <div className={`card-fn ${isMissing ? 'bad' : ''}`}>{isMissing ? '⚠ Saknar bild' : (card.fn || '')}</div>
          <div className="card-actions">
            <button className={`btn-hdr ${isHeader ? 'on' : ''}`}
              onClick={() => { pushUndo(); toggleHeader(si, ci); saveState() }}>
              {isHeader ? '★ Huvud' : '☆ Sätt huvud'}
            </button>
            <button className="btn-move" onClick={() => setShowMoveModal(true)}>↔ Flytta</button>
            <button className="btn-del"
              onClick={() => {
                const label = card.cat === '(huvud)' ? `huvudkategori "${gallery[si].section}"` : `"${card.cat}"`
                if (confirm(`Ta bort ${label}?`)) { pushUndo(); deleteCard(si, ci); saveState() }
              }}>✕ Ta bort</button>
          </div>
        </div>
      </div>

      {showImageModal && <ImageModal si={si} ci={ci} onClose={() => setShowImageModal(false)} />}
      {showMoveModal && <MoveModal si={si} ci={ci} onClose={() => setShowMoveModal(false)} />}
    </>
  )
}
