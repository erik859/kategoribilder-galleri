import { useState } from 'react'
import { useStore } from '../../store'
import { verifyToken } from '../../utils/github'

export default function GithubSetupModal() {
  const { showGhSetup, setShowGhSetup, setGhCredentials, loadFromGitHub } = useStore()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!showGhSetup) return null

  async function save() {
    if (!token.trim()) return
    setLoading(true); setError('')
    try {
      const user = await verifyToken(token.trim())
      setGhCredentials(user.login, token.trim())
      setShowGhSetup(false)
      loadFromGitHub()
    } catch (e) {
      setError('Kunde inte verifiera token: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowGhSetup(false)}>
      <div className="modal-box">
        <h3>🔗 GitHub-anslutning</h3>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
          Ange din GitHub Personal Access Token (PAT) med <strong>repo</strong>-behörighet. Den sparas bara i din webbläsare.
        </p>
        <label className="field-label">Personal Access Token</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" autoComplete="off"
          onKeyDown={e => e.key === 'Enter' && save()} />
        <p style={{ fontSize: 11, color: '#aaa', marginBottom: 16 }}>
          Skapa token på: github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → scope: <strong>repo</strong>
        </p>
        {error && <p style={{ color: '#c44', fontSize: 11, marginBottom: 8 }}>{error}</p>}
        <div className="modal-row">
          <button className="btn-secondary" onClick={() => setShowGhSetup(false)}>Avbryt</button>
          <button className="btn-primary" onClick={save} disabled={loading}>{loading ? 'Kontrollerar...' : 'Spara'}</button>
        </div>
      </div>
    </div>
  )
}
