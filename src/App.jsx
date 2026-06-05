import { useEffect, useCallback } from 'react'
import { useStore } from './store'
import Toolbar from './components/Toolbar'
import GalleryView from './components/GalleryView'
import WebshopView from './components/WebshopView'
import GithubSetupModal from './components/modals/GithubSetupModal'
import DragHint from './components/DragHint'

export default function App() {
  const { curView, loadFromGitHub, undo, redo, gallery, undoStack, redoStack } = useStore()

  // Load data on mount — show localStorage immediately, then sync GitHub
  useEffect(() => { loadFromGitHub() }, [])

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
  }, [undo, redo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const totalImg = gallery.reduce((n, s) => n + s.cards.filter(c => c.type === 'image').length, 0)
  const totalMiss = gallery.reduce((n, s) => n + s.cards.filter(c => c.type !== 'image').length, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
        <h1 style={{ color: '#1F4E79', fontSize: 24, marginBottom: 0 }}>Kategoribilder — Galleri</h1>
        <button className="btn-primary" style={{ background: '#27AE60', borderColor: '#27AE60', padding: '7px 16px', fontSize: 13 }}
          onClick={() => useStore.getState().setCurView('export')}>⬇ Exportera CSV</button>
      </div>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
        Klicka på bild → redigera &bull; Dubbelklicka på kategorinamn → redigera &bull; Dra & släpp bild direkt på kort
      </p>

      <div className="stats">
        <div className="stat"><div className="n">{totalImg}</div><div className="l">✓ Har bild</div></div>
        <div className="stat"><div className="n">{totalMiss}</div><div className="l">⚠ Saknar bild</div></div>
        <div className="stat"><div className="n">{totalImg + totalMiss}</div><div className="l">Kategorier totalt</div></div>
        <div className="stat"><div className="n">{gallery.length}</div><div className="l">Sektioner</div></div>
      </div>

      <div className="legend">
        <div className="leg"><div className="dot" style={{ borderColor: '#2E75B6', background: '#dbeeff' }} />Huvudkategori</div>
        <div className="leg"><div className="dot" style={{ borderColor: '#d0e8c0', background: '#f0fff0' }} />Underkategori</div>
        <div className="leg"><div className="dot" style={{ borderColor: '#f5c07a', background: '#fffaf0', borderStyle: 'dashed' }} />Saknar bild</div>
      </div>

      <Toolbar />

      <div className="view-tabs">
        <button className={`view-tab ${curView === 'gallery' ? 'active' : ''}`} onClick={() => useStore.getState().setCurView('gallery')}>📋 Gallerivy</button>
        <button className={`view-tab ${curView === 'webshop' ? 'active' : ''}`} onClick={() => useStore.getState().setCurView('webshop')}>🛒 Webshop-vy</button>
      </div>

      {curView === 'gallery' && <GalleryView />}
      {curView === 'webshop' && <WebshopView />}

      <GithubSetupModal />
      <DragHint />
    </div>
  )
}
