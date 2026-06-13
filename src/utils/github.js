export const GH_REPO = 'kategoribilder-galleri'
export const DEFAULT_FILE = 'data.json'
export const PROJECTS_FILE = 'projects.json'

// Data files live in public/ so Vite copies them into the deployed build (dist/).
// Reads use BASE_URL (which maps to dist root on Pages); writes target this path.
const PUBLIC_DIR = 'public'
function repoPath(file) { return `${PUBLIC_DIR}/${file}` }

function getOwner() { return localStorage.getItem('gh_owner') || '' }
function getToken() { return localStorage.getItem('gh_token') || '' }

function strToB64(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

export async function verifyToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ── Generic file IO ──────────────────────────────────────────────────────────

// Read any JSON file from the same origin the app is served from.
// Works locally (Vite serves the repo file) and on GitHub Pages (same-origin),
// so reading needs no token/owner. import.meta.env.BASE_URL = '/kategoribilder-galleri/'.
export async function loadJson(file) {
  const base = import.meta.env.BASE_URL || '/'
  const res = await fetch(`${base}${file}?t=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status })
  return res.json()
}

// Get the current SHA of a file (needed for updates). null if no token / not found.
export async function getSha(file) {
  const token = getToken(), owner = getOwner()
  if (!token || !owner) return null
  try {
    const meta = await fetch(
      `https://api.github.com/repos/${owner}/${GH_REPO}/contents/${repoPath(file)}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
    )
    if (meta.ok) { const m = await meta.json(); return m.sha }
  } catch (_) {}
  return null
}

// Write a JSON file via the Contents API. Requires token. Returns the new SHA.
export async function saveJson(file, data, sha, message) {
  const token = getToken(), owner = getOwner()
  if (!token || !owner) throw new Error('Ingen token')
  const content = strToB64(JSON.stringify(data))
  const body = { message: message || `Uppdatera ${file}`, content }
  if (sha) body.sha = sha
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${GH_REPO}/contents/${repoPath(file)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  )
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || `HTTP ${res.status}`) }
  const json = await res.json()
  return json.content.sha
}

// ── data.json convenience wrappers (per project file) ────────────────────────

export async function loadData(file = DEFAULT_FILE) {
  const payload = await loadJson(file)
  const sha = await getSha(file)
  return { payload, sha }
}

export async function saveData(data, sha, file = DEFAULT_FILE) {
  return saveJson(file, data, sha)
}
