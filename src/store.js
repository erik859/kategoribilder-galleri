import { create } from 'zustand'
import { loadData, saveData } from './utils/github'
import { catToFilename } from './utils/helpers'

const MAX_UNDO = 20

function loadLocalStorage() {
  try {
    const s = localStorage.getItem('kbg_state')
    if (!s) return null
    const p = JSON.parse(s)
    return Array.isArray(p) ? { gallery: p, woo: [], mapping: [] } : p
  } catch { return null }
}

function saveLocalStorage(gallery, woo, mapping) {
  try { localStorage.setItem('kbg_state', JSON.stringify({ gallery, woo, mapping })) } catch (_) {}
}

export const useStore = create((set, get) => {
  const local = loadLocalStorage()

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

    // ── Sync status ──────────────────────────────────────────────────────
    setSyncStatus: (status, text) => set({ syncStatus: status, syncText: text }),

    // ── Load from GitHub ─────────────────────────────────────────────────
    loadFromGitHub: async () => {
      const { ghOwner, ghToken } = get()
      set({ syncStatus: 'loading', syncText: '⏳ Laddar...' })
      try {
        const { payload, sha } = await loadData()
        const gallery = Array.isArray(payload) ? payload : (payload.gallery || [])
        const woo = Array.isArray(payload) ? [] : (payload.woo || [])
        const mapping = Array.isArray(payload) ? [] : (payload.mapping || [])
        set({ gallery, woo, mapping, dataSha: sha,
          syncStatus: ghToken ? 'ok' : 'warn',
          syncText: ghToken ? '✓ Synkad' : '👁 Skrivskyddad – klicka ⚙ GitHub för att spara'
        })
        saveLocalStorage(gallery, woo, mapping)
      } catch (e) {
        set({ syncStatus: 'err', syncText: '✗ ' + e.message })
        // Fallback to localStorage
        const local = loadLocalStorage()
        if (local) set({ gallery: local.gallery, woo: local.woo, mapping: local.mapping })
      }
    },

    // ── Save to GitHub ───────────────────────────────────────────────────
    saveState: async () => {
      const { gallery, woo, mapping, dataSha, ghToken, undoStack } = get()
      saveLocalStorage(gallery, woo, mapping)
      // Push undo
      const prev = undoStack[undoStack.length - 1]
      const snapshot = JSON.stringify({ gallery, woo })
      if (!prev || prev !== snapshot) {
        const newStack = [...undoStack, snapshot].slice(-MAX_UNDO)
        set({ undoStack: newStack, redoStack: [] })
      }
      if (!ghToken) { set({ syncStatus: 'warn', syncText: '⚠ Ingen token – sparas bara lokalt' }); return }
      set({ syncStatus: 'saving', syncText: '💾 Sparar...' })
      try {
        const newSha = await saveData({ gallery, woo, mapping }, dataSha)
        set({ dataSha: newSha, syncStatus: 'ok', syncText: '✓ Sparat' })
        setTimeout(() => set({ syncText: '✓ Synkad' }), 2000)
      } catch (e) {
        set({ syncStatus: 'err', syncText: '✗ ' + e.message })
      }
    },

    // ── Undo / Redo ──────────────────────────────────────────────────────
    undo: () => {
      const { undoStack, redoStack, gallery, woo } = get()
      if (!undoStack.length) return
      const prev = JSON.parse(undoStack[undoStack.length - 1])
      const current = JSON.stringify({ gallery, woo })
      set({
        gallery: prev.gallery, woo: prev.woo,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, current].slice(-MAX_UNDO),
        syncStatus: 'warn', syncText: '⚠ Ångrat'
      })
      saveLocalStorage(prev.gallery, prev.woo, get().mapping)
    },
    redo: () => {
      const { undoStack, redoStack, gallery, woo } = get()
      if (!redoStack.length) return
      const next = JSON.parse(redoStack[redoStack.length - 1])
      const current = JSON.stringify({ gallery, woo })
      set({
        gallery: next.gallery, woo: next.woo,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, current].slice(-MAX_UNDO),
      })
      saveLocalStorage(next.gallery, next.woo, get().mapping)
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
      const gallery = get().gallery.map((s, i) => i !== si ? s : {
        ...s, cards: s.cards.map((c, j) => ({ ...c, is_header: j === ci ? !c.is_header : (ci === j ? false : c.is_header) }))
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
    setFilter: (f) => set({ filter: f }),
  }
})
