export const GH_REPO = 'kategoribilder-galleri'
export const GH_FILE = 'data.json'

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

export async function loadData() {
  const owner = getOwner()
  const repo = GH_REPO
  const file = GH_FILE
  // Fetch via GitHub Pages (no CORS issue, no auth needed)
  const res = await fetch(
    `https://${owner}.github.io/${repo}/${file}?t=${Date.now()}`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const payload = await res.json()
  // Get SHA for later saves (requires token)
  let sha = null
  const token = getToken()
  if (token && owner) {
    try {
      const meta = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file}`,
        { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
      )
      if (meta.ok) { const m = await meta.json(); sha = m.sha }
    } catch (_) {}
  }
  return { payload, sha }
}

export async function saveData(data, sha) {
  const token = getToken()
  const owner = getOwner()
  if (!token || !owner) throw new Error('Ingen token')
  const content = strToB64(JSON.stringify(data))
  const body = { message: 'Uppdatera data.json', content }
  if (sha) body.sha = sha
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${GH_REPO}/contents/${GH_FILE}`,
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
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || `HTTP ${res.status}`) }
  const json = await res.json()
  return json.content.sha
}
