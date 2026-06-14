// This file provides the API bridge. Components and store import from here.
// On login, the Auth context calls setStudioApi() to inject the Firestore-backed API.
// The proxy translates old SQLite-style calling conventions to the new Firestore API.

import { createFirestoreApi, type FirestoreManuscript, type FirestoreSeries, type FirestoreSection, type FirestoreNote, type FirestoreFont, type FirestoreMessage, type FirestoreConversation } from "./firestoreData";

// Re-export types
export type Manuscript = FirestoreManuscript
export type Series = FirestoreSeries
export type Section = FirestoreSection
export type PlanningNote = FirestoreNote
export type CustomFont = FirestoreFont
export type AIMessage = FirestoreMessage
export type AIConversation = FirestoreConversation

export type FirestoreApi = ReturnType<typeof createFirestoreApi>

// The singleton API instance — set when the user authenticates
let _api: FirestoreApi | null = null

export function setStudioApi(api: FirestoreApi | null) {
  _api = api
}

export function getStudioApi(): FirestoreApi | null {
  return _api
}

// ─── Internal caches for resolving parent manuscript IDs ──────────────────────

const sectionToMsCache = new Map<string, string>()
const noteToMsCache = new Map<string, string>()

// ─── Typed API shape — matches the OLD studioApi interface exactly ────────────

type Id = number | string

export interface StudioApi {
  manuscripts: {
    getAll: () => Promise<any[]>
    getById: (id: Id) => Promise<any>
    create: (data: any) => Promise<any>
    update: (id: Id, data: any) => Promise<void>
    delete: (id: Id) => Promise<void>
    getWordCount: (id: Id) => Promise<number>
  }
  series: {
    getAll: () => Promise<any[]>
    create: (data: any) => Promise<any>
    update: (id: Id, data: any) => Promise<void>
    delete: (id: Id) => Promise<void>
    getManuscripts: (id: Id) => Promise<any[]>
  }
  sections: {
    getByManuscript: (msId: Id) => Promise<any[]>
    getById: (id: Id) => Promise<any>
    create: (data: any) => Promise<any>
    // OLD convention: update(id, data), delete(id), saveContent(id, content, wordCount)
    update: (id: Id, data: any) => Promise<void>
    delete: (id: Id) => Promise<void>
    reorder: (sectionId: Id, newPos: number, newParentId: Id | null) => Promise<void>
    saveContent: (sectionId: Id, content: string, wordCount: number) => Promise<void>
  }
  versions: {
    getRecent: (sectionId: Id, limit: number) => Promise<any[]>
    getContent: (versionId: Id) => Promise<string>
    restore: (sectionId: Id, versionId: Id) => Promise<void>
  }
  notes: {
    getByManuscript: (msId: Id) => Promise<any[]>
    // OLD convention: create(data) with manuscript_id in data
    create: (data: any) => Promise<any>
    // OLD convention: update(id, data), delete(id)
    update: (id: Id, data: any) => Promise<void>
    delete: (id: Id) => Promise<void>
  }
  fonts: {
    getAll: () => Promise<any[]>
    import: (file: File) => Promise<any>
    delete: (id: Id) => Promise<void>
    openDialog: () => Promise<File | null>
  }
  covers: {
    import: (file: File) => Promise<string>
    openDialog: () => Promise<File | null>
    getDataUrl: (key: string) => Promise<string>
  }
  ai: {
    chat: (messages: {role:string,content:string}[], model?: string) => Promise<string>
    streamChat: (messages: {role:string,content:string}[], model: string, onChunk: (chunk: string|null) => void) => Promise<void>
    getConversations: (manuscriptId?: Id) => Promise<any[]>
    createConversation: (manuscriptId?: Id, title?: string) => Promise<any>
    getMessages: (conversationId: Id) => Promise<any[]>
    saveMessage: (conversationId: Id, role: string, content: string, model?: string) => Promise<any>
    deleteConversation: (id: Id) => Promise<void>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
    getAll: () => Promise<Record<string, string>>
  }
  export: {
    generate: (format: 'pdf'|'epub', manuscriptId: Id, options: Record<string, unknown>) => Promise<{canceled: boolean}>
  }
}

// ─── Compatibility wrapper ────────────────────────────────────────────────────

// ─── Field name converter: camelCase → snake_case for backwards compat ────────

const KEY_MAP: Record<string, string> = {
  seriesId: 'series_id', seriesOrder: 'series_order', coverPath: 'cover_path',
  trimSize: 'trim_size', exportFont: 'export_font', targetWords: 'target_words',
  wordCount: 'word_count', createdAt: 'created_at', updatedAt: 'updated_at',
  manuscriptId: 'manuscript_id', parentId: 'parent_id', isIncluded: 'is_included',
  positionX: 'position_x', positionY: 'position_y',
  familyName: 'family_name', fileName: 'file_name', dataBase64: 'data_base64',
  filePath: 'file_path', conversationId: 'conversation_id', modelUsed: 'model_used',
  savedAt: 'saved_at',
}

function toSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnake)
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  if (obj.toDate || obj.seconds) return obj // Timestamp — leave as-is
  const out: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = KEY_MAP[key] ?? key
    out[mappedKey] = toSnake(value)
  }
  return out
}

const INVERSE_KEY_MAP: Record<string, string> = {}
for (const [camel, snake] of Object.entries(KEY_MAP)) {
  INVERSE_KEY_MAP[snake] = camel
}

function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel)
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  if (obj instanceof File || obj instanceof Blob || obj.constructor?.name === 'File' || obj.constructor?.name === 'Blob') return obj
  const out: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = INVERSE_KEY_MAP[key] ?? key
    out[mappedKey] = toCamel(value)
  }
  return out
}

// ─── Compatibility wrapper ────────────────────────────────────────────────────

export const studioApi: StudioApi = new Proxy({} as any, {
  get(_target, prop: string) {
    if (!_api) {
      if (prop === 'manuscripts' || prop === 'series' || prop === 'fonts' || prop === 'sections') {
        return new Proxy({}, { get: () => async () => [] })
      }
      return new Proxy({}, { get: () => async () => ({}) })
    }

    const api = _api as any
    if (prop === 'manuscripts') {
      return {
        getAll: async () => toSnake(await api.manuscripts.getAll()),
        getById: async (id: Id) => toSnake(await api.manuscripts.getById(String(id))),
        create: async (data: any) => toSnake(await api.manuscripts.create(toCamel(data))),
        update: (id: Id, data: any) => api.manuscripts.update(String(id), toCamel(data)),
        delete: (id: Id) => api.manuscripts.delete(String(id)),
        getWordCount: () => 0,
      }
    }
    if (prop === 'series') {
      return {
        getAll: async () => toSnake(await api.series.getAll()),
        create: async (data: any) => toSnake(await api.series.create(toCamel(data))),
        update: (id: Id, data: any) => api.series.update(String(id), toCamel(data)),
        delete: (id: Id) => api.series.delete(String(id)),
        getManuscripts: () => [],
      }
    }
    if (prop === 'sections') {
      return {
        getByManuscript: async (msId: Id) => {
          const result = await api.sections.getByManuscript(String(msId))
          for (const s of result) sectionToMsCache.set(String(s.id), String(msId))
          return toSnake(result)
        },
        getById: async (id: Id) => {
          const msId = sectionToMsCache.get(String(id)) ?? ''
          const r = msId ? await api.sections.getById(msId, String(id)) : null
          return toSnake(r)
        },
        create: async (data: any) => {
          const result = await api.sections.create(toCamel(data))
          const msId = data.manuscript_id ?? data.manuscriptId ?? ''
          sectionToMsCache.set(String(result.id), String(msId))
          return toSnake(result)
        },
        update: async (id: Id, data: any) => {
          const sid = String(id)
          let msId = sectionToMsCache.get(sid)
          if (!msId && data.manuscript_id) msId = String(data.manuscript_id)
          if (!msId && data.manuscriptId) msId = String(data.manuscriptId)
          if (msId) await api.sections.update(msId, sid, toCamel(data))
        },
        delete: async (id: Id) => {
          const sid = String(id)
          const msId = sectionToMsCache.get(sid) ?? ''
          if (msId) await api.sections.delete(msId, sid)
        },
        reorder: async (sectionId: Id, newPos: number, newParentId: Id | null) => {
          const sid = String(sectionId)
          const msId = sectionToMsCache.get(sid) ?? ''
          if (msId) await api.sections.reorder(msId, sid, newPos, newParentId ?? null)
        },
        saveContent: async (sectionId: Id, content: string, wordCount: number) => {
          const sid = String(sectionId)
          const msId = sectionToMsCache.get(sid) ?? ''
          if (msId) await api.sections.saveContent(msId, sid, content, wordCount)
        },
      }
    }
    if (prop === 'versions') {
      return {
        getRecent: async (sectionId: Id, limit: number) => {
          const sid = String(sectionId)
          const msId = sectionToMsCache.get(sid) ?? ''
          return msId ? toSnake(await api.versions.getRecent(msId, sid, limit)) : []
        },
        getContent: async (versionId: Id) => {
          for (const [sId, mId] of sectionToMsCache) {
            const content = await api.versions.getContent(mId, sId, String(versionId))
            if (content) return content
          }
          return ''
        },
        restore: () => {},
      }
    }
    if (prop === 'notes') {
      return {
        getByManuscript: async (msId: Id) => {
          const result = await api.notes.getByManuscript(String(msId))
          for (const n of result) noteToMsCache.set(String(n.id), String(msId))
          return toSnake(result)
        },
        create: async (data: any) => {
          const msId = data.manuscript_id ?? data.manuscriptId ?? ''
          const result = await api.notes.create(String(msId), toCamel(data))
          noteToMsCache.set(String(result.id), String(msId))
          return toSnake(result)
        },
        update: async (id: Id, data: any) => {
          const nid = String(id)
          let msId = noteToMsCache.get(nid)
          if (!msId && data.manuscript_id) msId = String(data.manuscript_id)
          if (!msId && data.manuscriptId) msId = String(data.manuscriptId)
          if (msId) await api.notes.update(msId, nid, toCamel(data))
        },
        delete: async (id: Id) => {
          const nid = String(id)
          const msId = noteToMsCache.get(nid) ?? ''
          if (msId) await api.notes.delete(msId, nid)
        },
      }
    }
    if (prop === 'fonts') {
      return {
        getAll: async () => toSnake(await api.fonts.getAll()),
        import: async (file: File) => toSnake(await api.fonts.import(file)),
        delete: (id: Id) => api.fonts.delete(String(id)),
        openDialog: () => openFontPicker(),
      }
    }
    if (prop === 'covers') {
      return {
        import: (file: File) => api.covers.import(file),
        openDialog: () => openCoverPicker(),
        getDataUrl: (coverKey: string) => api.covers.getDataUrl(coverKey),
      }
    }
    if (prop === 'ai') {
      return {
        chat: async () => '',
        streamChat: async () => {},
        getConversations: async (manuscriptId?: Id) => toSnake(await api.ai.getConversations(manuscriptId ? String(manuscriptId) : undefined)),
        createConversation: async (manuscriptId?: Id, title?: string) => toSnake(await api.ai.createConversation(manuscriptId ? String(manuscriptId) : undefined, title)),
        getMessages: async (conversationId: Id) => toSnake(await api.ai.getMessages(String(conversationId))),
        saveMessage: async (conversationId: Id, role: string, content: string, model?: string) => toSnake(await api.ai.saveMessage(String(conversationId), role, content, model)),
        deleteConversation: (id: Id) => api.ai.deleteConversation(String(id)),
      }
    }
    if (prop === 'settings') {
      return {
        get: () => null,
        set: (key: string, value: string) => api.settings.set(key, value),
        getAll: async () => await api.settings.getAll(),
      }
    }
    if (prop === 'export') {
      return {
        generate: () => ({ canceled: false }),
      }
    }
    return undefined
  }
})

// ─── Minified PDF/EPUB generator ─────────────────────────────────────────────

const TRIM_DIMS: Record<string, { w: number; h: number }> = { '6x9': { w: 432, h: 648 }, '5.5x8.5': { w: 396, h: 612 }, '5x8': { w: 360, h: 576 }, '8.5x11': { w: 612, h: 792 }, '6.14x9.21': { w: 442, h: 664 }, '7x10': { w: 504, h: 720 } }
const MG: Record<string, { t: number; b: number; i: number; o: number }> = { moderate: { t: 54, b: 54, i: 54, o: 54 }, narrow: { t: 36, b: 36, i: 36, o: 36 }, wide: { t: 72, b: 72, i: 72, o: 72 }, verywide: { t: 90, b: 90, i: 90, o: 90 } }

function esc(s: string): string { return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"') }

export function buildExportContent(format: string, ms: any, sections: any[], options: Record<string, unknown>): string {
  const trim = TRIM_DIMS[(options.trimSize as string) ?? '6x9'] ?? TRIM_DIMS['6x9']
  const mg = MG[(options.margins as string) ?? 'moderate'] ?? MG.moderate
  const font = (options.exportFont as string) === 'sans' ? "'Inter', 'Helvetica Neue', Arial, sans-serif" : "'Georgia', 'Times New Roman', serif"
  const fs = 10.5; const lh = ((options.lineSpacing as number) ?? 1.6) * fs
  const cw = trim.w - mg.i - mg.o; const cpl = Math.floor(cw / (fs * 0.55))
  const lpp = Math.floor((trim.h - mg.t - mg.b) / lh)

  if (format === 'epub') {
    const secHTML = sections.filter((s: any) => s.isIncluded ?? s.is_included).map((s: any) => {
      const blocks = parseTipTapContent(s.content)
      return `<section id="ch${s.id}">${blocksToHTML(blocks)}</section>`
    }).join('\n')

    return JSON.stringify({
      mimetype: 'application/epub+zip',
      title: ms.title, author: ms.author, font, lineSpacing: options.lineSpacing ?? 1.6,
      sectionHTML: secHTML, sections: sections.filter((s: any) => s.isIncluded ?? s.is_included),
      dropCaps: options.dropCaps, hyphenation: options.hyphenation,
    })
  }

  const pages: string[] = []
  let lines: string[] = []
  let pg = 1

  function np() { if (lines.length) { pages.push(pageHTML(lines, pg, font, lh)); lines = []; pg++ } }
  function al(text: string) {
    const ws = text.split(/\s+/); let cur = ''
    for (const w of ws) {
      if (cur.length + w.length + 1 > cpl && cur.length > 0) { lines.push(cur.trim()); cur = w; if (lines.length >= lpp) np() }
      else cur += (cur ? ' ' : '') + w
    }
    if (cur) { lines.push(cur.trim()); if (lines.length >= lpp) np() }
  }

  const vc = Math.floor(lpp / 2) - 4
  for (let i = 0; i < vc; i++) lines.push(''); lines.push(ms.title); if (ms.subtitle) lines.push(ms.subtitle); lines.push(''); if (ms.author) lines.push(ms.author); np()
  for (let i = 0; i < vc; i++) lines.push(''); lines.push(`Copyright \u00A9 ${new Date().getFullYear()} ${ms.author ?? 'Author'}`); lines.push('All rights reserved.'); np()

  for (const s of sections.filter((s: any) => s.isIncluded ?? s.is_included)) {
    if (lines.length > lpp - 6) np()
    if (s.type === 'chapter') {
      for (let i = 0; i < 4; i++) al('')
      al(s.title.toUpperCase()); al('')
      if (options.dropCaps) { al('\u2726'); al('') }
    }
    const blocks = parseTipTapContent(s.content)
    for (const b of blocks) {
      if (b.type === 'chapter') {
        if (lines.length > lpp - 6) np()
        for (let i = 0; i < 4; i++) al(''); al(`CHAPTER ${b.chapterNumber}`); if (b.chapterTitle) al(b.chapterTitle); al('')
        if (options.dropCaps) { al('\u2726'); al('') }
      } else if (b.type === 'sceneBreak') {
        al(''); al('          * * *'); al('')
      } else if (b.type === 'paragraph') {
        al(b.text)
      }
    }
  }
  np()

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(ms.title)}</title><style>
@page{size:${trim.w}pt ${trim.h}pt;margin:${mg.t}pt ${mg.o}pt ${mg.b}pt ${mg.i}pt;@bottom-center{content:counter(page);font-size:9pt;font-family:${font}}}
body{font-family:${font};font-size:${fs}pt;line-height:${options.lineSpacing ?? 1.6};color:#1a1a1a;text-align:justify;hyphens:${options.hyphenation ? 'auto' : 'none'};widows:2;orphans:2}
.page{width:${cw}pt;height:${trim.h - mg.t - mg.b}pt;position:relative;page-break-after:always;overflow:hidden}.page:last-child{page-break-after:auto}
.page-num{position:absolute;bottom:-${mg.b - 18}pt;width:100%;text-align:center;font-size:9pt;color:#555}
.title-page{text-align:center}.title-page .bt{font-size:22pt;font-weight:bold;margin-bottom:6pt}.title-page .bs{font-size:14pt;font-style:italic;color:#444}.title-page .ba{font-size:12pt;margin-top:12pt;letter-spacing:1pt}
.copyright-page{text-align:center;font-size:9pt;color:#666}.copyright-page p{margin:3pt 0}
.chapter-label{font-size:10pt;letter-spacing:3pt;text-transform:uppercase;color:#555;text-align:center;margin-top:36pt}
.chapter-ornament{text-align:center;font-size:14pt;color:#999;margin:6pt 0}
.drop-cap::first-letter{float:left;font-size:42pt;line-height:0.8;margin-right:4pt;margin-top:4pt;font-weight:bold}
.drop-cap{text-indent:0}p{margin:0 0 ${lh}pt 0;text-indent:1.5em}p:first-of-type,.drop-cap{text-indent:0}
.scene-break{text-align:center;margin:18pt 0;color:#999;letter-spacing:6pt;font-size:10pt}
</style></head><body>${pages.join('\n')}</body></html>`
}

interface ParsedBlock { type: string; text: string; chapterNumber?: number; chapterTitle?: string }
function parseTipTapContent(json: string): ParsedBlock[] {
  let doc: any; try { doc = JSON.parse(json) } catch { return [{ type: 'paragraph', text: '' }] }
  const blocks: ParsedBlock[] = []; let cc = 0
  function walk(nodes: any[]) { for (const n of nodes) {
    if (n.type === 'chapterNode') { cc++; blocks.push({ type: 'chapter', text: '', chapterNumber: n.attrs?.chapterNumber ?? cc, chapterTitle: n.attrs?.title ?? '' }); continue }
    if (n.type === 'sceneBreak') { blocks.push({ type: 'sceneBreak', text: '* * *' }); continue }
    if (n.type === 'paragraph') { blocks.push({ type: 'paragraph', text: extractText(n) }); continue }
    if (n.type === 'heading') { blocks.push({ type: 'paragraph', text: extractText(n).toUpperCase() }); continue }
    if (n.content) walk(n.content)
  }}
  walk(doc.content ?? []); return blocks
}
function extractText(n: any): string { if (n.text) return n.text; if (n.content) return n.content.map(extractText).join(''); return '' }
function blocksToHTML(blocks: ParsedBlock[]): string {
  return blocks.map(b => {
    if (b.type === 'chapter') return `<div class="chapter-header"><p class="chapter-number">Chapter ${b.chapterNumber}</p><h2>${esc(b.chapterTitle ?? '')}</h2></div>`
    if (b.type === 'sceneBreak') return `<div class="scene-break">* * *</div>`
    if (b.type === 'paragraph') return b.text.trim() ? `<p>${esc(b.text)}</p>` : ''
    return ''
  }).filter(Boolean).join('\n')
}
function pageHTML(lines: string[], pg: number, font: string, lh: number): string {
  const isTitle = lines.some(l => l.match(/^(Copyright |All rights)/))
  if (isTitle || lines.some(l => !l.match(/^(CHAPTER |\u2726|\s*\*\s*\*\s*\*|)/) && lines.length < 8)) {
    const cls = isTitle ? 'copyright-page' : 'title-page'
    return `<div class="page ${cls}"><div>${lines.filter(l => l.trim()).map(l => `<p>${esc(l)}</p>`).join('')}</div></div>`
  }
  const inner = lines.map((l, i) => {
    if (!l.trim()) return ''
    if (/^CHAPTER\s/.test(l.trim())) return `<div class="chapter-label">${esc(l.trim())}</div>`
    if (l.trim() === '\u2726') return `<div class="chapter-ornament">\u2726</div>`
    if (/^\s*\*\s*\*\s*\*/.test(l)) return `<div class="scene-break">* * *</div>`
    const isDP = i > 0 && lines[i-1].trim() === '\u2726'
    return `<p class="${isDP ? 'drop-cap' : ''}">${esc(l.trim())}</p>`
  }).filter(Boolean).join('')
  return `<div class="page">${inner}<div class="page-num">${pg}</div></div>`
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export function openFontPicker(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.ttf,.otf,.woff2'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}
export function openCoverPicker(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}