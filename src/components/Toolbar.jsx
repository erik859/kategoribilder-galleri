import { useState } from 'react'
import { useStore } from '../store'
import CsvExportModal from './modals/CsvExportModal'

export default function Toolbar() {
  const { filter, setFilter, loadFromGitHub, resetProject, syncStatus, syncText, undoStack, redoStack, undo, redo, gallery, setShowGhSetup } = useStore()
  const [showCsv, setShowCsv] = useState(false)

  const sections = gallery.map((s, i) => ({ label: `${s.section} (${s.cards.length})`, value: i }))

  return (
    <>
      <div className="toolbar">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Alla</button>
        <button className={filter === 'miss' ? 'active' : ''} onClick={() => setFilter('miss')}>Saknar bild</button>
        <button className={filter === 'done' ? 'active' : ''} onClick={() => setFilter('done')}>Har bild</button>

        <select onChange={e => {
          if (!e.target.value) return
          const el = document.getElementById('s' + e.target.value)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          e.target.value = ''
        }} defaultValue="">
          <option value="">— Hoppa till sektion —</option>
          {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <button onClick={() => setShowCsv(true)} style={{ borderColor: '#27AE60', color: '#27AE60', fontWeight: 'bold' }}>⬇ CSV</button>
        <button onClick={loadFromGitHub} style={{ borderColor: '#2E75B6', color: '#2E75B6', fontWeight: 'bold' }}>🔄 Hämta senaste</button>
        <button onClick={() => { if (confirm('Laddar om från GitHub och tar bort lokala ändringar för detta projekt. Säker?')) resetProject() }}
          style={{ borderColor: '#c44', color: '#c44', fontSize: 11 }}>↺ Återställ</button>
        <button onClick={() => setShowGhSetup(true)} style={{ borderColor: '#888', color: '#666', fontSize: 11 }}>⚙ GitHub</button>

        <button onClick={undo} disabled={!undoStack.length} style={{ opacity: undoStack.length ? 1 : 0.4 }} title={`Ångra (${undoStack.length} steg)`}>↩ Ångra</button>
        <button onClick={redo} disabled={!redoStack.length} style={{ opacity: redoStack.length ? 1 : 0.4 }}>↪ Gör om</button>

        <span className={`sync-badge sync-${syncStatus}`}>{syncText}</span>
      </div>

      {showCsv && <CsvExportModal onClose={() => setShowCsv(false)} />}
    </>
  )
}
