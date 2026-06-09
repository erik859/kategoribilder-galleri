import { useStore } from '../store'

export default function ProjectSelector() {
  const { projects, currentProjectId, switchProject, addProject, renameProject, deleteProject } = useStore()
  const current = projects.find(p => p.id === currentProjectId) || projects[0]

  function onAdd() {
    const name = prompt('Namn på nytt projekt:')
    if (name?.trim()) addProject(name.trim())
  }
  function onRename() {
    if (!current) return
    const name = prompt('Nytt namn på projektet:', current.name)
    if (name?.trim() && name.trim() !== current.name) renameProject(current.id, name.trim())
  }
  function onDelete() {
    if (!current || current.id === 'default') return
    if (confirm(`Ta bort projektet "${current.name}"? Datafilen finns kvar på GitHub men projektet försvinner ur listan.`)) {
      deleteProject(current.id)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>📁 Projekt:</span>
      <select value={currentProjectId} onChange={e => switchProject(e.target.value)}
        style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', background: 'white', color: '#1F4E79', fontWeight: 600, cursor: 'pointer' }}>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <button onClick={onAdd} title="Nytt projekt" style={btn('#27AE60')}>＋ Nytt</button>
      <button onClick={onRename} title="Byt namn" style={btn('#2E75B6')}>✎</button>
      <button onClick={onDelete} title="Ta bort projekt" disabled={currentProjectId === 'default'}
        style={{ ...btn('#c44'), opacity: currentProjectId === 'default' ? 0.35 : 1, cursor: currentProjectId === 'default' ? 'not-allowed' : 'pointer' }}>🗑</button>
    </div>
  )
}

function btn(color) {
  return { fontSize: 12, padding: '4px 9px', border: `1px solid ${color}`, color, background: 'white', borderRadius: 6, cursor: 'pointer' }
}
