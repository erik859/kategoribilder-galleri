import { create } from 'zustand'
import { loadData, saveData, loadJson, saveJson, getSha, PROJECTS_FILE } from './utils/github'
import { catToFilename } from './utils/helpers'

const MAX_UNDO = 20
const DEFAULT_PROJECT = { id: 'default', name: 'Standard', file: 'data.json' }

// ── Project registry persistence (localStorage cache) ────────────────────────
function loadProjectsLocal() {
  try {
    const s = localStorage.getItem('kbg_projects')
    if (s) { const p = JSON.parse(s); if (Array.isArray(p) && p.length) return p }
  } catch (_) {}
  return null
}
function saveProjectsLocal(projects) {
  try { localStorage.setItem('kbg_projects', JSON.stringify(projects)) } catch (_) {}
}

// ── Per-project data cache (localStorage) ────────────────────────────────────
function stateKey(id) { return `kbg_state_${id}` }

function loadLocalStorage(projectId) {
  try {
    let s = localStorage.getItem(stateKey(projectId))
    // migrate legacy single-project key
    if (!s && projectId === 'default') s = localStorage.getItem('kbg_state')
    if (!s) return null
    const p = JSON.parse(s)
    return Array.isArray(p) ? { gallery: p, woo: [], mapping: [] } : p
  } catch { return null }
}
function saveLocalStorage(projectId, gallery, woo, mapping) {
  try { localStorage.setItem(stateKey(projectId), JSON.stringify({ gallery, woo, mapping })) } catch (_) {}
}

function slugify(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'projekt'
}

export const useStore = create((set, get) => {
  const projects = loadProjectsLocal() || [DEFAULT_PROJECT]
  const savedId = localStorage.getItem('kbg_current_project')
  const currentProjectId = projects.find(p => p.id === savedId) ? savedId : projects[0].id
  const local = loadLocalStorage(currentProjectId)

  // Resolve the data file of the active project
  const curFile = () => {
    const { projects, currentProjectId } = get()
    return (projects.find(p => p.id === currentProjectId) || DEFAULT_PROJECT).file
  }

  return {
    gallery: local?.gallery || [],
    woo: local?.woo || [],
    mapping: local?.mapping || [],
    dataSha: null,
    syncStatus: 'loading',
    syncText: '⏳ Laddar...',
    undoStack: [],
    redoStack: [],
    curView: 'gallery',
    filter: 'all',
    ghOwner: localStorage.getItem('gh_owner') || '',
    ghToken: localStorage.getItem('gh_token') || '',
    showGhSetup: false,
    showCsv: false,

    // Projects
    projects,
    currentProjectId,
    projectsSha: null,

    // ── Sync status ──────────────────────────────────────────────────────
    setSyncStatus: (status, text) => set({ syncStatus: status, syncText: text }),

    // ── App init: load project registry, then the active project's data ──
    init: async () => {
      await get().loadProjects()
      await get().loadFromGitHub()
    },

    // ── Load project registry (projects.json on GitHub) ──────────────────
    loadProjects: async () => {
      try {
        const remote = await loadJson(PROJECTS_FILE)
        if (Array.isArray(remote) && remote.length) {
          saveProjectsLocal(remote)
          let { currentProjectId } = get()
          if (!remote.find(p => p.id === currentProjectId)) currentProjectId = remote[0].id
          const sha = await getSha(PROJECTS_FILE)
          set({ projects: remote, currentProjectId, projectsSha: sha })
        }
      } catch (_) {
        // projects.json doesn't exist yet — keep local/default list
      }
    },

    // ── Persist project registry (local + GitHub if token) ───────────────
    saveProjects: async (projects) => {
      saveProjectsLocal(projects)
      const { ghToken, projectsSha } = get()
      if (!ghToken) return
      try {
        const sha = await saveJson(PROJECTS_FILE, projects, projectsSha, 'Uppdatera projects.json')
        set({ projectsSha: sha })
      } catch (e) {
        set({ syncStatus: 'err', syncText: '✗ Kunde inte spara projektlista: ' + e.message })
      }
    },

    // ── Load active project data from GitHub ─────────────────────────────
    loadFromGitHub: async () => {
      const { ghToken, currentProjectId } = get()
      set({ syncStatus: 'loading', syncText: '⏳ Laddar...' })
      try {
        const { payload, sha } = await loadData(curFile())
        const gallery = Array.isArray(payload) ? payload : (payload.gallery || [])
        const woo = Array.isArray(payload) ? [] : (payload.woo || [])
        const mapping = Array.isArray(payload) ? [] : (payload.mapping || [])
        set({ gallery, woo, mapping, dataSha: sha,
          syncStatus: ghToken ? 'ok' : 'warn',
          syncText: ghToken ? '✓ Synkad' : '👁 Skrivskyddad – klicka ⚙ GitHub för att spara'
        })
        saveLocalStorage(currentProjectId, gallery, woo, mapping)
      } catch (e) {
        const local = loadLocalStorage(currentProjectId)
        if (local) {
          set({ gallery: local.gallery, woo: local.woo, mapping: local.mapping,
            syncStatus: 'warn', syncText: '⚠ Visar lokal kopia (' + e.message + ')' })
        } else {
          set({ gallery: [], woo: [], mapping: [], dataSha: null,
            syncStatus: 'err', syncText: '✗ ' + e.message })
        }
      }
    },

    // ── Save active project data to GitHub ───────────────────────────────
    saveState: async () => {
      const { gallery, woo, mapping, dataSha, ghToken, currentProjectId } = get()
      // Undo-snapshot tas av pushUndo() FÖRE varje mutation — gör det inte här igen
      // (annars hamnar både före- och efter-läget i stacken → ångra kräver dubbeltryck)
      saveLocalStorage(currentProjectId, gallery, woo, mapping)
      if (!ghToken) { set({ syncStatus: 'warn', syncText: '⚠ Ingen token – sparas bara lokalt' }); return }
      set({ syncStatus: 'saving', syncText: '💾 Sparar...' })
      try {
        const newSha = await saveData({ gallery, woo, mapping }, dataSha, curFile())
        set({ dataSha: newSha, syncStatus: 'ok', syncText: '✓ Sparat' })
        setTimeout(() => set({ syncText: '✓ Synkad' }), 2000)
      } catch (e) {
        set({ syncStatus: 'err', syncText: '✗ ' + e.message })
      }
    },

    // ── Project management ───────────────────────────────────────────────
    switchProject: async (id) => {
      const { currentProjectId, gallery, woo, mapping, projects } = get()
      if (id === currentProjectId || !projects.find(p => p.id === id)) return
      // cache current project before switching
      saveLocalStorage(currentProjectId, gallery, woo, mapping)
      localStorage.setItem('kbg_current_project', id)
      const local = loadLocalStorage(id)
      set({
        currentProjectId: id,
        gallery: local?.gallery || [],
        woo: local?.woo || [],
        mapping: local?.mapping || [],
        dataSha: null, undoStack: [], redoStack: [],
        syncStatus: 'loading', syncText: '⏳ Laddar...'
      })
      await get().loadFromGitHub()
    },

    addProject: async (name) => {
      const { projects, ghToken } = get()
      let id = slugify(name), n = 1
      while (projects.find(p => p.id === id)) id = `${slugify(name)}-${++n}`
      const file = `data-${id}.json`
      const project = { id, name: (name || '').trim() || id, file }
      const newProjects = [...projects, project]
      set({ projects: newProjects })
      await get().saveProjects(newProjects)
      // create an empty data file so the project is shareable via GitHub
      if (ghToken) {
        try { await saveJson(file, { gallery: [], woo: [], mapping: [] }, null, `Skapa ${file}`) } catch (_) {}
      }
      await get().switchProject(id)
      return project
    },

    renameProject: async (id, name) => {
      const { projects } = get()
      const newProjects = projects.map(p => p.id === id ? { ...p, name: (name || '').trim() || p.name } : p)
      set({ projects: newProjects })
      await get().saveProjects(newProjects)
    },

    deleteProject: async (id) => {
      if (id === 'default') return
      const { projects, currentProjectId } = get()
      const newProjects = projects.filter(p => p.id !== id)
      localStorage.removeItem(stateKey(id))
      set({ projects: newProjects })
      await get().saveProjects(newProjects)
      if (currentProjectId === id) await get().switchProject(newProjects[0]?.id || 'default')
    },

    // Reset active project to GitHub state (drops local edits)
    resetProject: () => {
      const { currentProjectId } = get()
      localStorage.removeItem(stateKey(currentProjectId))
      if (currentProjectId === 'default') localStorage.removeItem('kbg_state')
      get().loadFromGitHub()
    },

    // ── Undo / Redo ──────────────────────────────────────────────────────
    undo: () => {
      const { undoStack, redoStack, gallery, woo, currentProjectId } = get()
      if (!undoStack.length) return
      const prev = JSON.parse(undoStack[undoStack.length - 1])
      const current = JSON.stringify({ gallery, woo })
      set({
        gallery: prev.gallery, woo: prev.woo,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, current].slice(-MAX_UNDO),
        syncStatus: 'warn', syncText: '⚠ Ångrat'
      })
      saveLocalStorage(currentProjectId, prev.gallery, prev.woo, get().mapping)
    },
    redo: () => {
      const { undoStack, redoStack, gallery, woo, currentProjectId } = get()
      if (!redoStack.length) return
      const next = JSON.parse(redoStack[redoStack.length - 1])
      const current = JSON.stringify({ gallery, woo })
      set({
        gallery: next.gallery, woo: next.woo,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, current].slice(-MAX_UNDO),
      })
      saveLocalStorage(currentProjectId, next.gallery, next.woo, get().mapping)
    },
    pushUndo: () => {
      const { gallery, woo, undoStack } = get()
      const snapshot = JSON.stringify({ gallery, woo })
      set({ undoStack: [...undoStack, snapshot].slice(-MAX_UNDO), redoStack: [] })
    },

    // ── Gallery mutations ────────────────────────────────────────────────
    setGallery: (gallery) => set({ gallery }),
    setWoo: (woo) => set({ woo }),

    updateCard: (si, ci, updates) => {
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: s.cards.map((c, j) => j !== ci ? c : { ...c, ...updates })
      })
      set({ gallery })
    },

    deleteCard: (si, ci) => {
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: s.cards.filter((_, j) => j !== ci)
      })
      set({ gallery })
    },

    addCard: (si, card) => {
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: [...s.cards, card]
      })
      set({ gallery })
    },

    moveCard: (fromSi, fromCi, toSi, toCi, mode = 'replace') => {
      const g = get().gallery.map(s => ({ ...s, cards: [...s.cards] }))
      const src = g[fromSi].cards[fromCi]
      if (mode === 'replace') {
        const dst = g[toSi].cards[toCi]
        g[toSi].cards[toCi] = { ...dst, type: src.type, manualUrl: src.manualUrl, drive_id: src.drive_id, fn: dst.cat ? catToFilename(dst.cat) : src.fn, seoAlt: dst.cat + ' – ' + g[toSi].section + ' cykel' }
        g[fromSi].cards[fromCi] = { ...src, type: 'missing', manualUrl: undefined, drive_id: undefined, fn: undefined, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(src.cat + ' cykel')}` }
      } else {
        const newCard = { ...src, is_header: false, seoAlt: src.cat + ' – ' + g[toSi].section + ' cykel' }
        g[fromSi].cards[fromCi] = { ...src, type: 'missing', manualUrl: undefined, drive_id: undefined, fn: undefined, search_url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(src.cat + ' cykel')}` }
        g[toSi].cards.splice(toCi, 0, newCard)
      }
      set({ gallery: g })
    },

    reorderCards: (si, fromCi, toCi) => {
      const gallery = get().gallery.map((s, i) => {
        if (i !== si) return s
        const cards = [...s.cards]
        const [moved] = cards.splice(fromCi, 1)
        cards.splice(toCi > fromCi ? toCi - 1 : toCi, 0, moved)
        return { ...s, cards }
      })
      set({ gallery })
    },

    reorderSections: (fromIdx, toIdx) => {
      const gallery = [...get().gallery]
      const [moved] = gallery.splice(fromIdx, 1)
      gallery.splice(toIdx > fromIdx ? toIdx - 1 : toIdx, 0, moved)
      set({ gallery })
    },

    renameSection: (si, name) => {
      const gallery = get().gallery.map((s, i) => i !== si ? s : { ...s, section: name })
      set({ gallery })
    },

    addSection: (name) => {
      const gallery = [...get().gallery, { section: name, cards: [] }]
      set({ gallery })
    },

    renameCard: (si, ci, cat) => {
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: s.cards.map((c, j) => j !== ci ? c : { ...c, cat })
      })
      set({ gallery })
    },

    toggleHeader: (si, ci) => {
      // Exklusivt: markera klickat kort som huvud och nollställ alla andra i sektionen
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: s.cards.map((c, j) => {
          if (j === ci) return { ...c, is_header: !c.is_header }
          return c.is_header ? { ...c, is_header: false } : c
        })
      })
      set({ gallery })
    },

    // ── GitHub auth ──────────────────────────────────────────────────────
    setGhCredentials: (owner, token) => {
      localStorage.setItem('gh_owner', owner)
      localStorage.setItem('gh_token', token)
      set({ ghOwner: owner, ghToken: token })
    },

    // ── View / filter ────────────────────────────────────────────────────
    setCurView: (v) => set({ curView: v }),
    setShowGhSetup: (v) => set({ showGhSetup: v }),
    setShowCsv: (v) => set({ showCsv: v }),
    setFilter: (f) => set({ filter: f }),
  }
})
