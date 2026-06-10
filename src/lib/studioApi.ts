// Browser-native API implementations — no Electron IPC needed.
// All data is stored in sql.js WASM (persisted to localStorage).
// AI uses direct fetch to OpenRouter. Exports generate client-side files.

import { initDatabase, getDb, persist, now } from './db'

let dbReady: Promise<void> | null = null

function ensureDb(): Promise<void> {
  if (!dbReady) dbReady = initDatabase()
  return dbReady
}

// Helpers — copied from db.ts for independence
function rows(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

function firstRow(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown> | null {
  const all = rows(result)
  return all.length ? all[0] : null
}

// ─── Manuscripts ──────────────────────────────────────────────────────────────

async function manuscriptsGetAll() {
  await ensureDb(); const db = getDb()!
  return rows(db.exec(`SELECT m.*, COALESCE((SELECT SUM(s.word_count) FROM sections s WHERE s.manuscript_id = m.id), 0) AS word_count FROM manuscripts m ORDER BY m.updated_at DESC`))
}
async function manuscriptsGetById(id: number) { await ensureDb(); return firstRow(getDb()!.exec('SELECT * FROM manuscripts WHERE id = ?', [id])) }
async function manuscriptsCreate(data: Record<string, any>) {
  await ensureDb(); const db = getDb()!; const ts = now()
  db.run(`INSERT INTO manuscripts (series_id, series_order, title, subtitle, author, description, genre, cover_path, trim_size, theme, export_font, target_words, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?)`, [data.series_id ?? null, data.series_order ?? 1, data.title ?? 'Untitled Novel', data.subtitle ?? null, data.author ?? null, data.description ?? null, data.genre ?? null, data.cover_path ?? null, data.trim_size ?? '6x9', data.theme ?? 'classic', data.export_font ?? 'serif', data.target_words ?? 80000, data.status ?? 'drafting', ts, ts])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist()
  return firstRow(db.exec('SELECT * FROM manuscripts WHERE id = ?', [id]))
}
async function manuscriptsUpdate(id: number, data: Record<string, any>) {
  await ensureDb(); const db = getDb()!; const keys = Object.keys(data);
  db.run(`UPDATE manuscripts SET ${keys.map(k => `${k}=?`).join(',')}, updated_at=? WHERE id=?`, [...Object.values(data), now(), id]); persist()
  return firstRow(db.exec('SELECT * FROM manuscripts WHERE id = ?', [id]))
}
async function manuscriptsDelete(id: number) { await ensureDb(); getDb()!.run('DELETE FROM manuscripts WHERE id=?', [id]); persist() }
async function manuscriptsWordCount(id: number) { await ensureDb(); const r = getDb()!.exec('SELECT COALESCE(SUM(word_count),0) AS total FROM sections WHERE manuscript_id=?', [id]); return (firstRow(r) as any)?.total ?? 0 }

// ─── Series ──────────────────────────────────────────────────────────────────

async function seriesGetAll() { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM series ORDER BY title ASC')) }
async function seriesCreate(data: Record<string, any>) { await ensureDb(); const db = getDb()!; db.run('INSERT INTO series (title,description,cover_path,created_at) VALUES (?,?,?,?)', [data.title ?? 'Untitled Series', data.description ?? null, data.cover_path ?? null, now()]); const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist(); return firstRow(db.exec('SELECT * FROM series WHERE id=?', [id])) }
async function seriesUpdate(id: number, data: Record<string, any>) { await ensureDb(); const db = getDb()!; const keys = Object.keys(data); db.run(`UPDATE series SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`, [...Object.values(data), id]); persist(); return firstRow(db.exec('SELECT * FROM series WHERE id=?', [id])) }
async function seriesDelete(id: number) { await ensureDb(); getDb()!.run('DELETE FROM series WHERE id=?', [id]); persist() }
async function seriesGetManuscripts(id: number) { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM manuscripts WHERE series_id=? ORDER BY series_order ASC', [id])) }

// ─── Sections ────────────────────────────────────────────────────────────────

async function sectionsGetByManuscript(msId: number) { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM sections WHERE manuscript_id=? ORDER BY position ASC', [msId])) }
async function sectionsGetById(id: number) { await ensureDb(); return firstRow(getDb()!.exec('SELECT * FROM sections WHERE id=?', [id])) }
async function sectionsCreate(data: Record<string, any>) {
  await ensureDb(); const db = getDb()!
  const maxR = db.exec('SELECT COALESCE(MAX(position),-1) AS mx FROM sections WHERE manuscript_id=? AND parent_id IS ?', [data.manuscript_id, data.parent_id ?? null])
  const maxPos = (firstRow(maxR) as any)?.mx ?? -1; const ts = now()
  db.run('INSERT INTO sections (manuscript_id,parent_id,type,title,position,content,word_count,is_included,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)', [data.manuscript_id, data.parent_id ?? null, data.type ?? 'chapter', data.title ?? 'Untitled', maxPos + 1, data.content ?? '{}', 0, 1, ts, ts])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist()
  return firstRow(db.exec('SELECT * FROM sections WHERE id=?', [id]))
}
async function sectionsUpdate(id: number, data: Record<string, any>) { await ensureDb(); const db = getDb()!; const keys = Object.keys(data); db.run(`UPDATE sections SET ${keys.map(k => `${k}=?`).join(',')}, updated_at=? WHERE id=?`, [...Object.values(data), now(), id]); persist() }
async function sectionsDelete(id: number) { await ensureDb(); getDb()!.run('DELETE FROM sections WHERE id=?', [id]); persist() }
async function sectionsReorder(sectionId: number, newPos: number, newParentId: number | null) {
  await ensureDb(); const db = getDb()!
  const sec = firstRow(db.exec('SELECT * FROM sections WHERE id=?', [sectionId])) as any; if (!sec) return
  db.run('UPDATE sections SET position=position+1 WHERE manuscript_id=? AND id!=? AND parent_id IS ? AND position>=?', [sec.manuscript_id, sectionId, newParentId, newPos])
  db.run('UPDATE sections SET parent_id=?, position=?, updated_at=? WHERE id=?', [newParentId, newPos, now(), sectionId]); persist()
}
async function sectionsSaveContent(id: number, content: string, wordCount: number) {
  await ensureDb(); const db = getDb()!; const ts = now()
  db.run('UPDATE sections SET content=?, word_count=?, updated_at=? WHERE id=?', [content, wordCount, ts, id])
  db.run('INSERT INTO versions (section_id,content,word_count,saved_at) VALUES (?,?,?,?)', [id, content, wordCount, ts])
  persist()
}

// ─── Versions ────────────────────────────────────────────────────────────────

async function versionsGetRecent(sectionId: number, limit: number) { await ensureDb(); return rows(getDb()!.exec('SELECT id,word_count,saved_at FROM versions WHERE section_id=? ORDER BY saved_at DESC LIMIT ?', [sectionId, limit])) }
async function versionsGetContent(versionId: number) { await ensureDb(); const r = firstRow(getDb()!.exec('SELECT content FROM versions WHERE id=?', [versionId])); return (r as any)?.content ?? '' }
async function versionsRestore(sectionId: number, versionId: number) { await ensureDb(); const db = getDb()!; const v = firstRow(db.exec('SELECT content,word_count FROM versions WHERE id=?', [versionId])) as any; if (!v) return; db.run('UPDATE sections SET content=?, word_count=?, updated_at=? WHERE id=?', [v.content, v.word_count, now(), sectionId]); persist() }

// ─── Planning Notes ──────────────────────────────────────────────────────────

async function notesGetByManuscript(msId: number) { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM planning_notes WHERE manuscript_id=? ORDER BY category,created_at', [msId])) }
async function notesCreate(data: Record<string, any>) { await ensureDb(); const db = getDb()!; db.run('INSERT INTO planning_notes (manuscript_id,category,title,content,color,position_x,position_y) VALUES (?,?,?,?,?,?,?)', [data.manuscript_id, data.category ?? 'misc', data.title ?? 'New Note', data.content ?? '', data.color ?? '#fef3c7', data.position_x ?? 0, data.position_y ?? 0]); const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist(); return firstRow(db.exec('SELECT * FROM planning_notes WHERE id=?', [id])) }
async function notesUpdate(id: number, data: Record<string, any>) { await ensureDb(); const db = getDb()!; const keys = Object.keys(data); db.run(`UPDATE planning_notes SET ${keys.map(k => `${k}=?`).join(',')}, updated_at=? WHERE id=?`, [...Object.values(data), now(), id]); persist() }
async function notesDelete(id: number) { await ensureDb(); getDb()!.run('DELETE FROM planning_notes WHERE id=?', [id]); persist() }

// ─── Fonts ───────────────────────────────────────────────────────────────────

async function fontsGetAll() { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM custom_fonts ORDER BY family_name')) }
async function fontsImport(file: File): Promise<Record<string, unknown>> {
  await ensureDb(); const db = getDb()!
  const familyName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'ttf'
  const format = ext === 'otf' ? 'opentype' : ext === 'woff2' ? 'woff2' : 'truetype'
  const base64 = await fileToBase64(file)
  db.run('INSERT OR IGNORE INTO custom_fonts (family_name,file_name,data_base64,format,weight,style) VALUES (?,?,?,?,?,?)', [familyName, file.name, base64, format, '400', 'normal'])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist()
  // Inject @font-face
  injectFontFace(familyName, base64, format)
  return firstRow(db.exec('SELECT * FROM custom_fonts WHERE id=?', [id]))!
}
async function fontsDelete(id: number) { await ensureDb(); getDb()!.run('DELETE FROM custom_fonts WHERE id=?', [id]); persist() }

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const injectedFonts = new Set<string>()
function injectFontFace(family: string, base64: string, format: string) {
  if (injectedFonts.has(family)) return
  injectedFonts.add(family)
  const style = document.createElement('style')
  style.textContent = `@font-face { font-family:"${family}"; src:url(data:font/${format};base64,${base64}) format("${format}"); font-weight:400; font-style:normal; font-display:swap; }`
  document.head.appendChild(style)
}

// ─── Covers ──────────────────────────────────────────────────────────────────

async function coversGetDataUrl(coverKey: string): Promise<string> {
  const existing = localStorage.getItem(`cover:${coverKey}`)
  if (existing) return existing
  // If it's a base64 key stored directly
  return coverKey.startsWith('data:') ? coverKey : ''
}
async function coversImport(file: File): Promise<string> {
  const base64 = await fileToBase64(file)
  const dataUrl = `data:${file.type};base64,${base64}`
  const key = `cover:${Date.now()}:${file.name}`
  localStorage.setItem(key, dataUrl)
  return key
}

// ─── AI Chat ─────────────────────────────────────────────────────────────────

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

function getApiKey(): string {
  const db = getDb(); if (!db) return ''
  const r = db.exec('SELECT value FROM app_settings WHERE key=?', ['openrouter_api_key'])
  return r.length && r[0].values.length ? (r[0].values[0][0] as string) ?? '' : ''
}

function getDefaultModel(): string {
  const db = getDb(); if (!db) return 'mistralai/mistral-7b-instruct:free'
  const r = db.exec('SELECT value FROM app_settings WHERE key=?', ['openrouter_model'])
  return r.length && r[0].values.length ? (r[0].values[0][0] as string) ?? 'mistralai/mistral-7b-instruct:free' : 'mistralai/mistral-7b-instruct:free'
}

async function aiChat(messages: { role: string; content: string }[], model?: string) {
  await ensureDb()
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('No OpenRouter API key configured')

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model ?? getDefaultModel(), messages, max_tokens: 2048, temperature: 0.7 }),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`OpenRouter ${res.status}: ${t}`) }
  const json = await res.json() as { choices: { message: { content: string } }[] }
  return json.choices[0]?.message?.content ?? ''
}

async function aiStreamChat(messages: { role: string; content: string }[], model: string, onChunk: (chunk: string | null) => void) {
  await ensureDb()
  const apiKey = getApiKey()
  if (!apiKey) { onChunk('Error: No API key configured.'); onChunk(null); return }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 2048, temperature: 0.7 }),
  })
  if (!res.ok) { onChunk(`Error: OpenRouter ${res.status}`); onChunk(null); return }

  const reader = res.body?.getReader(); if (!reader) { onChunk(null); return }
  const decoder = new TextDecoder(); let buffer = ''
  while (true) {
    const { done, value } = await reader.read(); if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n'); buffer = lines.pop() ?? ''
    for (const line of lines) {
      const t = line.trim(); if (!t || t === 'data: [DONE]' || !t.startsWith('data: ')) continue
      try { const j = JSON.parse(t.slice(6)) as { choices: { delta: { content?: string } }[] }; const c = j.choices[0]?.delta?.content; if (c) onChunk(c) } catch {}
    }
  }
  onChunk(null)
}

async function aiGetConversations(manuscriptId?: number) {
  await ensureDb()
  if (manuscriptId) return rows(getDb()!.exec('SELECT * FROM ai_conversations WHERE manuscript_id=? ORDER BY created_at DESC', [manuscriptId]))
  return rows(getDb()!.exec('SELECT * FROM ai_conversations ORDER BY created_at DESC LIMIT 50'))
}
async function aiCreateConversation(manuscriptId?: number, title?: string) {
  await ensureDb(); const db = getDb()!
  db.run('INSERT INTO ai_conversations (manuscript_id,title,created_at) VALUES (?,?,?)', [manuscriptId ?? null, title ?? 'New Conversation', now()])
  const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist()
  return firstRow(db.exec('SELECT * FROM ai_conversations WHERE id=?', [id]))
}
async function aiGetMessages(conversationId: number) { await ensureDb(); return rows(getDb()!.exec('SELECT * FROM ai_messages WHERE conversation_id=? ORDER BY created_at ASC', [conversationId])) }
async function aiSaveMessage(conversationId: number, role: string, content: string, model?: string) { await ensureDb(); const db = getDb()!; db.run('INSERT INTO ai_messages (conversation_id,role,content,model_used,created_at) VALUES (?,?,?,?,?)', [conversationId, role, content, model ?? null, now()]); const id = db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0] as number; persist(); return firstRow(db.exec('SELECT * FROM ai_messages WHERE id=?', [id])) }
async function aiDeleteConversation(id: number) { await ensureDb(); getDb()!.run('DELETE FROM ai_conversations WHERE id=?', [id]); persist() }

// ─── Settings ────────────────────────────────────────────────────────────────

async function settingsGet(key: string) { await ensureDb(); const r = firstRow(getDb()!.exec('SELECT value FROM app_settings WHERE key=?', [key])); return (r as any)?.value ?? null }
async function settingsSet(key: string, value: string) { await ensureDb(); getDb()!.run('INSERT OR REPLACE INTO app_settings (key,value) VALUES (?,?)', [key, value]); persist() }
async function settingsGetAll() { await ensureDb(); const result = rows(getDb()!.exec('SELECT key,value FROM app_settings')); return Object.fromEntries(result.map(r => [r.key, r.value])) }

// ─── Export ───────────────────────────────────────────────────────────────────

async function exportGenerate(format: 'pdf' | 'epub', manuscriptId: number, options: { [key: string]: unknown }) {
  await ensureDb(); const db = getDb()!

  const ms = firstRow(db.exec('SELECT * FROM manuscripts WHERE id=?', [manuscriptId])) as any
  if (!ms) throw new Error('Manuscript not found')

  const secResult = db.exec('SELECT * FROM sections WHERE manuscript_id=? ORDER BY position ASC', [manuscriptId])
  const sections = rows(secResult)

  // Build the export content
  const content = buildExportContent(format, ms, sections, options)
  const filename = `${ms.title.replace(/[^a-zA-Z0-9 ]/g, '')}.${format === 'pdf' ? 'html' : 'json'}`

  // Trigger download
  const blob = new Blob([content], { type: format === 'pdf' ? 'text/html' : 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)

  return { canceled: false }
}

// ─── Minified PDF/EPUB generator (full version from original export.ts) ────

const TRIM_DIMS: Record<string, { w: number; h: number }> = { '6x9': { w: 432, h: 648 }, '5.5x8.5': { w: 396, h: 612 }, '5x8': { w: 360, h: 576 }, '8.5x11': { w: 612, h: 792 }, '6.14x9.21': { w: 442, h: 664 }, '7x10': { w: 504, h: 720 } }
const MG: Record<string, { t: number; b: number; i: number; o: number }> = { moderate: { t: 54, b: 54, i: 54, o: 54 }, narrow: { t: 36, b: 36, i: 36, o: 36 }, wide: { t: 72, b: 72, i: 72, o: 72 }, verywide: { t: 90, b: 90, i: 90, o: 90 } }

function esc(s: string): string { return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"') }

function buildExportContent(format: string, ms: any, sections: any[], options: Record<string, unknown>): string {
  const trim = TRIM_DIMS[(options.trimSize as string) ?? '6x9'] ?? TRIM_DIMS['6x9']
  const mg = MG[(options.margins as string) ?? 'moderate'] ?? MG.moderate
  const font = (options.exportFont as string) === 'sans' ? "'Inter', 'Helvetica Neue', Arial, sans-serif" : "'Georgia', 'Times New Roman', serif"
  const fs = 10.5; const lh = ((options.lineSpacing as number) ?? 1.6) * fs
  const cw = trim.w - mg.i - mg.o; const cpl = Math.floor(cw / (fs * 0.55))
  const lpp = Math.floor((trim.h - mg.t - mg.b) / lh)

  if (format === 'epub') {
    const secHTML = sections.filter((s: any) => s.is_included).map((s: any) => {
      const blocks = parseTipTapContent(s.content)
      return `<section id="ch${s.id}">${blocksToHTML(blocks)}</section>`
    }).join('\n')

    return JSON.stringify({
      mimetype: 'application/epub+zip',
      title: ms.title, author: ms.author, font, lineSpacing: options.lineSpacing ?? 1.6,
      sectionHTML: secHTML, sections: sections.filter((s: any) => s.is_included),
      dropCaps: options.dropCaps, hyphenation: options.hyphenation,
    })
  }

  // PDF HTML
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

  // Title page
  const vc = Math.floor(lpp / 2) - 4
  for (let i = 0; i < vc; i++) lines.push(''); lines.push(ms.title); if (ms.subtitle) lines.push(ms.subtitle); lines.push(''); if (ms.author) lines.push(ms.author); np()
  // Copyright
  for (let i = 0; i < vc; i++) lines.push(''); lines.push(`Copyright \u00A9 ${new Date().getFullYear()} ${ms.author ?? 'Author'}`); lines.push('All rights reserved.'); np()

  for (const s of sections.filter((s: any) => s.is_included)) {
    if (lines.length > lpp - 6) np()
    if (s.type === 'chapter') {
      for (let i = 0; i < 4; i++) al('')
      al(s.title.toUpperCase()); al('')
      if (options.dropCaps) { al('\u2726'); al('') }
    }
    const blocks = parseTipTapContent(s.content)
    let firstPara = true
    for (const b of blocks) {
      if (b.type === 'chapter') {
        if (lines.length > lpp - 6) np()
        for (let i = 0; i < 4; i++) al(''); al(`CHAPTER ${b.chapterNumber}`); if (b.chapterTitle) al(b.chapterTitle); al('')
        if (options.dropCaps) { al('\u2726'); al('') }
        firstPara = true
      } else if (b.type === 'sceneBreak') {
        al(''); al('          * * *'); al('')
      } else if (b.type === 'paragraph') {
        al(b.text); firstPara = false
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

// ─── API Surface ─────────────────────────────────────────────────────────────

export const studioApi = {
  manuscripts: { getAll: manuscriptsGetAll, getById: manuscriptsGetById, create: manuscriptsCreate, update: manuscriptsUpdate, delete: manuscriptsDelete, getWordCount: manuscriptsWordCount },
  series: { getAll: seriesGetAll, create: seriesCreate, update: seriesUpdate, delete: seriesDelete, getManuscripts: seriesGetManuscripts },
  sections: { getByManuscript: sectionsGetByManuscript, getById: sectionsGetById, create: sectionsCreate, update: sectionsUpdate, delete: sectionsDelete, reorder: sectionsReorder, saveContent: sectionsSaveContent },
  versions: { getRecent: versionsGetRecent, getContent: versionsGetContent, restore: versionsRestore },
  notes: { getByManuscript: notesGetByManuscript, create: notesCreate, update: notesUpdate, delete: notesDelete },
  fonts: { getAll: fontsGetAll, import: (file: File) => fontsImport(file), delete: fontsDelete, openDialog: () => openFontPicker() },
  covers: { import: (file: File) => coversImport(file), openDialog: () => openCoverPicker(), getDataUrl: coversGetDataUrl },
  ai: { chat: aiChat, streamChat: aiStreamChat, getConversations: aiGetConversations, createConversation: aiCreateConversation, getMessages: aiGetMessages, saveMessage: aiSaveMessage, deleteConversation: aiDeleteConversation },
  settings: { get: settingsGet, set: settingsSet, getAll: settingsGetAll },
  export: { generate: exportGenerate },
}

// Browser-native file pickers
function openFontPicker(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.ttf,.otf,.woff2'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}
function openCoverPicker(): Promise<File | null> {
  return new Promise(resolve => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}