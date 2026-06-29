import { create } from 'zustand'
import { loadData, saveData, loadJson, saveJson, getSha, verifyToken, PROJECTS_FILE } from './utils/github'
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
          if (!s && projectId === 'default') s = localStorage.getItem('kbg_state')
          if (!s) return null
          const p = JSON.parse(s)
          return Array.isArray(p) ? { gallery: p, woo: [], mapping: [] } : p
    } catch { return null }
}
function saveLocalStorage(projectId, gallery, woo, mapping) {
    try { localStorage.setItem(stateKey(projectId), JSON.stringify({ gallery, woo, mapping })) } catch (_) {}
}

function dirtyKey(id) { return `kbg_dirty_${id}` }
function setDirty(id, on) {
    try { if (on) localStorage.setItem(dirtyKey(id), '1'); else localStorage.removeItem(dirtyKey(id)) } catch (_) {}
}
function isDirty(id) {
    try { return localStorage.getItem(dirtyKey(id)) === '1' } catch { return false }
}
function savedShaKey(id) { return `kbg_savedsha_${id}` }
function getSavedSha(id) {
    try { return localStorage.getItem(savedShaKey(id)) || null } catch { return null }
}
function setSavedSha(id, sha) {
    try { if (sha) localStorage.setItem(savedShaKey(id), sha); else localStorage.removeItem(savedShaKey(id)) } catch (_) {}
}

function slugify(name) {
    return (name || '')
      .toLowerCase()
      .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'projekt'
}

// ── Sync helpers: keep gallery ↔ woo in sync ─────────────────────────────────
//
// woo rows: [l1, l2, l3]  where l2 = gallery section, l3 = category name
// When a category is added/deleted/renamed in gallery, woo is updated accordingly.
// When a category is deleted/renamed in woo (L3), gallery images are updated too.

/** Add a category to woo if it doesn't already exist (matched case-insensitively). */
function wooAddCat(woo, sectionName, catName) {
    const cn = catName.toLowerCase().trim()
    const sn = (sectionName || '').toLowerCase().trim()
    // already present as L3?
  if (woo.some(r => r[2] && r[2].toLowerCase().trim() === cn)) return woo
    // find an L2 row matching the section
  const existing = woo.find(r => r[1] && r[1].toLowerCase().trim() === sn)
    if (existing) {
          return [...woo, [existing[0], existing[1], catName]]
    }
    // no L2 for this section yet – add with empty L1
  return [...woo, ['', sectionName, catName]]
}

/** Remove all woo rows where L3 === catName (case-insensitive). */
function wooRemoveCat(woo, catName) {
    const cn = catName.toLowerCase().trim()
    return woo.filter(r => !(r[2] && r[2].toLowerCase().trim() === cn))
}

/** Rename a category in woo (L3 column, case-insensitive). */
function wooRenameCat(woo, oldName, newName) {
    const on = oldName.toLowerCase().trim()
    return woo.map(r => r[2] && r[2].toLowerCase().trim() === on ? [r[0], r[1], newName] : r)
}

/** Rename a section in woo (L2 column, case-insensitive). */
function wooRenameSection(woo, oldName, newName) {
    const on = oldName.toLowerCase().trim()
    return woo.map(r => r[1] && r[1].toLowerCase().trim() === on ? [r[0], newName, r[2]] : r)
}

/** Remove all woo rows that belong to a section (L2 column, case-insensitive). */
function wooRemoveSection(woo, sectionName) {
    const sn = sectionName.toLowerCase().trim()
    return woo.filter(r => !(r[1] && r[1].toLowerCase().trim() === sn))
}

/** Update gallery cards: rename cat field wherever it matches oldName. */
function galleryRenameCat(gallery, oldName, newName) {
    const on = oldName.toLowerCase().trim()
    return gallery.map(s => ({
          ...s,
          cards: s.cards.map(c =>
                  c.cat && c.cat.toLowerCase().trim() === on ? { ...c, cat: newName } : c
                                 )
    }))
}

/** Clear image from gallery cards where cat === catName (set type to missing). */
function galleryClearImg(gallery, catName) {
    const cn = catName.toLowerCase().trim()
    return gallery.map(s => ({
          ...s,
          cards: s.cards.map(c =>
                  c.cat && c.cat.toLowerCase().trim() === cn && c.type === 'image'
                                     ? { ...c, type: 'missing', manualUrl: undefined, drive_id: undefined, fn: undefined }
                    : c
                                 )
    }))
}

export const useStore = create((set, get) => {
    const projects = loadProjectsLocal() || [DEFAULT_PROJECT]
    const savedId = localStorage.getItem('kbg_current_project')
    const currentProjectId = projects.find(p => p.id === savedId) ? savedId : projects[0].id
    const local = loadLocalStorage(currentProjectId)

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

                                       projects,
                                       currentProjectId,
                                       projectsSha: null,

                                       setSyncStatus: (status, text) => set({ syncStatus: status, syncText: text }),

                                       init: async () => {
                                               await get().loadProjects()
                                               await get().loadFromGitHub()
                                       },

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
                                               } catch (_) {}
                                       },

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

                                       loadFromGitHub: async () => {
                                               const { ghToken, currentProjectId } = get()
                                               set({ syncStatus: 'loading', syncText: '⏳ Laddar...' })
                                               const dirty = isDirty(currentProjectId)
                                               const localCache = loadLocalStorage(currentProjectId)
                                               try {
                                                         const { payload, sha } = await loadData(curFile())
                                                         const remote = {
                                                                     gallery: Array.isArray(payload) ? payload : (payload.gallery || []),
                                                                     woo: Array.isArray(payload) ? [] : (payload.woo || []),
                                                                     mapping: Array.isArray(payload) ? [] : (payload.mapping || []),
                                                         }

                                                 if (dirty && localCache) {
                                                             set({ gallery: localCache.gallery, woo: localCache.woo, mapping: localCache.mapping, dataSha: sha })
                                                             if (!ghToken) {
                                                                           set({ syncStatus: 'warn', syncText: '⚠ Osparade ändringar (bara lokalt) – klicka ⚙ GitHub för permanent sparning' })
                                                                           return
                                                             }
                                                             try {
                                                                           await verifyToken(ghToken)
                                                                           set({ syncStatus: 'saving', syncText: '💾 Sparar väntande ändringar...' })
                                                                           await get().saveState()
                                                             } catch {
                                                                           set({ syncStatus: 'err', syncText: '⚠ Token ogiltig/utgången – osparade ändringar kvar lokalt (klicka ⚙ GitHub)' })
                                                             }
                                                             return
                                                 }

                                                 const savedSha = getSavedSha(currentProjectId)
                                                         if (savedSha && sha && sha === savedSha && localCache) {
                                                                     set({ gallery: localCache.gallery, woo: localCache.woo, mapping: localCache.mapping, dataSha: sha })
                                                                     if (!ghToken) { set({ syncStatus: 'warn', syncText: '👁 Skrivskyddad – klicka ⚙ GitHub för att spara' }); return }
                                                                     try { await verifyToken(ghToken); set({ syncStatus: 'ok', syncText: '✓ Synkad' }) }
                                                                     catch { set({ syncStatus: 'err', syncText: '⚠ Token ogiltig/utgången – ändringar sparas INTE (klicka ⚙ GitHub)' }) }
                                                                     return
                                                         }

                                                 set({ gallery: remote.gallery, woo: remote.woo, mapping: remote.mapping, dataSha: sha })
                                                         saveLocalStorage(currentProjectId, remote.gallery, remote.woo, remote.mapping)
                                                         setDirty(currentProjectId, false)
                                                         if (sha) setSavedSha(currentProjectId, sha)
                                                         if (!ghToken) {
                                                                     set({ syncStatus: 'warn', syncText: '👁 Skrivskyddad – klicka ⚙ GitHub för att spara' })
                                                         } else {
                                                                     try { await verifyToken(ghToken); set({ syncStatus: 'ok', syncText: '✓ Synkad' }) }
                                                                     catch { set({ syncStatus: 'err', syncText: '⚠ Token ogiltig/utgången – ändringar sparas INTE (klicka ⚙ GitHub)' }) }
                                                         }
                                               } catch (e) {
                                                         if (localCache) {
                                                                     set({ gallery: localCache.gallery, woo: localCache.woo, mapping: localCache.mapping,
                                                                                      syncStatus: 'warn', syncText: (isDirty(currentProjectId) ? '⚠ Osparade ändringar (offline?) – ' : '⚠ Visar lokal kopia – ') + e.message })
                                                         } else {
                                                                     set({ gallery: [], woo: [], mapping: [], dataSha: null,
                                                                                      syncStatus: 'err', syncText: '✗ ' + e.message })
                                                         }
                                               }
                                       },

                                       saveState: async () => {
                                               const { gallery, woo, mapping, dataSha, ghToken, currentProjectId } = get()
                                               saveLocalStorage(currentProjectId, gallery, woo, mapping)
                                               setDirty(currentProjectId, true)
                                               if (!ghToken) { set({ syncStatus: 'warn', syncText: '⚠ Sparat lokalt – klicka ⚙ GitHub för permanent sparning' }); return }
                                               set({ syncStatus: 'saving', syncText: '💾 Sparar...' })
                                               try {
                                                         const newSha = await saveData({ gallery, woo, mapping }, dataSha, curFile())
                                                         setDirty(currentProjectId, false)
                                                         setSavedSha(currentProjectId, newSha)
                                                         set({ dataSha: newSha, syncStatus: 'ok', syncText: '✓ Sparat' })
                                                         setTimeout(() => set({ syncText: '✓ Synkad' }), 2000)
                                               } catch (e) {
                                                         const bad = /bad credential|401|403|unauthorized/i.test(e.message)
                                                         set({ syncStatus: 'err', syncText: bad
                                                                        ? '✗ EJ SPARAT på GitHub – token ogiltig/utgången (kvar lokalt) (⚙ GitHub)'
                                                                     : '✗ EJ SPARAT på GitHub – ' + e.message + ' (kvar lokalt)' })
                                               }
                                       },

                                       switchProject: async (id) => {
                                               const { currentProjectId, gallery, woo, mapping, projects } = get()
                                               if (id === currentProjectId || !projects.find(p => p.id === id)) return
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
                                               const { projects, ghToken, gallery, woo, mapping } = get()
                                               let id = slugify(name), n = 1
                                               while (projects.find(p => p.id === id)) id = `${slugify(name)}-${++n}`
                                               const file = `data-${id}.json`
                                               const project = { id, name: (name || '').trim() || id, file }
                                               const newProjects = [...projects, project]
                                               const initial = JSON.parse(JSON.stringify({ gallery, woo, mapping }))
                                               saveLocalStorage(id, initial.gallery, initial.woo, initial.mapping)
                                               set({ projects: newProjects })
                                               await get().saveProjects(newProjects)
                                               setDirty(id, true)
                                               if (ghToken) {
                                                         try {
                                                                     const newSha = await saveJson(file, initial, null, `Skapa ${file} (kopia av aktivt projekt)`)
                                                                     setDirty(id, false); setSavedSha(id, newSha)
                                                         } catch (_) {}
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
                                               setDirty(id, false)
                                               setSavedSha(id, null)
                                               set({ projects: newProjects })
                                               await get().saveProjects(newProjects)
                                               if (currentProjectId === id) await get().switchProject(newProjects[0]?.id || 'default')
                                       },

                                       resetProject: () => {
                                               const { currentProjectId } = get()
                                               localStorage.removeItem(stateKey(currentProjectId))
                                               if (currentProjectId === 'default') localStorage.removeItem('kbg_state')
                                               setDirty(currentProjectId, false)
                                               setSavedSha(currentProjectId, null)
                                               get().loadFromGitHub()
                                       },

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
                                               setDirty(currentProjectId, true)
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
                                               setDirty(currentProjectId, true)
                                       },
                                       pushUndo: () => {
                                               const { gallery, woo, undoStack } = get()
                                               const snapshot = JSON.stringify({ gallery, woo })
                                               set({ undoStack: [...undoStack, snapshot].slice(-MAX_UNDO), redoStack: [] })
                                       },

                                       setGallery: (gallery) => set({ gallery }),
                                       setWoo: (woo) => set({ woo }),

                                       updateCard: (si, ci, updates) => {
                                               const gallery = get().gallery.map((s, i) => i !== si ? s : {
                                                         ...s, cards: s.cards.map((c, j) => j !== ci ? c : { ...c, ...updates })
                                               })
                                               set({ gallery })
                                       },

                                       // ── deleteCard: removes card from gallery AND from woo ────────────────────
                                       deleteCard: (si, ci) => {
                                               const { gallery, woo } = get()
                                               const catName = gallery[si]?.cards[ci]?.cat
                                               const newGallery = gallery.map((s, i) => i !== si ? s : {
                                                         ...s, cards: s.cards.filter((_, j) => j !== ci)
                                               })
                                               const newWoo = catName ? wooRemoveCat(woo, catName) : woo
                                               set({ gallery: newGallery, woo: newWoo })
                                       },

                                       // ── addCard: adds card to gallery AND to woo ──────────────────────────────
                                       addCard: (si, card) => {
                                               const { gallery, woo } = get()
                                               const sectionName = gallery[si]?.section || ''
                                               const newGallery = gallery.map((s, i) => i !== si ? s : {
                                                         ...s, cards: [...s.cards, card]
                                               })
                                               const newWoo = card.cat ? wooAddCat(woo, sectionName, card.cat) : woo
                                               set({ gallery: newGallery, woo: newWoo })
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

                                       // ── renameSection: updates gallery AND woo L2 ─────────────────────────────
                                       renameSection: (si, name) => {
                                               const { gallery, woo } = get()
                                               const oldName = gallery[si]?.section || ''
                                               const newGallery = gallery.map((s, i) => i !== si ? s : { ...s, section: name })
                                               const newWoo = wooRenameSection(woo, oldName, name)
                                               set({ gallery: newGallery, woo: newWoo })
                                       },

                                       addSection: (name) => {
                                               const gallery = [...get().gallery, { section: name, cards: [] }]
                                               set({ gallery })
                                       },

                                       // ── renameCard: updates gallery AND woo L3 ────────────────────────────────
                                       renameCard: (si, ci, cat) => {
                                               const { gallery, woo } = get()
                                               const oldCat = gallery[si]?.cards[ci]?.cat || ''
                                               const newGallery = gallery.map((s, i) => i !== si ? s : {
                                                         ...s, cards: s.cards.map((c, j) => j !== ci ? c : { ...c, cat })
                                               })
                                               const newWoo = wooRenameCat(woo, oldCat, cat)
                                               set({ gallery: newGallery, woo: newWoo })
                                       },

                                       toggleHeader: (si, ci) => {
                                               const gallery = get().gallery.map((s, i) => i !== si ? s : {
                                                         ...s, cards: s.cards.map((c, j) => {
                                                                     if (j === ci) return { ...c, is_header: !c.is_header }
                                                                     return c.is_header ? { ...c, is_header: false } : c
                                                         })
                                               })
                                               set({ gallery })
                                       },

                                       // ── woo mutations: also sync back to gallery where relevant ───────────────

                                       // Rename L3 in woo → also rename matching cards in gallery
                                       renameWooL3: (oldName, newName) => {
                                               if (oldName === newName) return
                                               const { gallery, woo } = get()
                                               const newWoo = wooRenameCat(woo, oldName, newName)
                                               const newGallery = galleryRenameCat(gallery, oldName, newName)
                                               set({ gallery: newGallery, woo: newWoo })
                                       },

                                       // Delete L3 from woo → also clear image from matching gallery card
                                       deleteWooL3: (l1, l2, l3) => {
                                               const { gallery, woo } = get()
                                               const newWoo = woo.filter(r => !(r[0] === l1 && r[1] === l2 && r[2] === l3))
                                               // Clear the image from the gallery card but keep the card itself
                                         const newGallery = galleryClearImg(gallery, l3)
                                               set({ gallery: newGallery, woo: newWoo })
                                       },

                                       setGhCredentials: (owner, token) => {
                                               localStorage.setItem('gh_owner', owner)
                                               localStorage.setItem('gh_token', token)
                                               set({ ghOwner: owner, ghToken: token })
                                       },

                                       setCurView: (v) => set({ curView: v }),
                                       setShowGhSetup: (v) => set({ showGhSetup: v }),
                                       setShowCsv: (v) => set({ showCsv: v }),
                                       setFilter: (f) => set({ filter: f }),
                                 }
})
