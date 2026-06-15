import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js'

let db: Database | null = null
let SQL: SqlJsStatic | null = null
const DB_KEY = 'novel-studio-db'

// ─── Schema ───────────────────────────────────────────────────────────────────

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS series (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT,
  cover_path  TEXT,
  created_at  TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS manuscripts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id     INTEGER REFERENCES series(id),
  series_order  INTEGER DEFAULT 1,
  title         TEXT    NOT NULL,
  subtitle      TEXT,
  author        TEXT,
  description   TEXT,
  genre         TEXT,
  cover_path    TEXT,
  trim_size     TEXT    DEFAULT '6x9',
  theme         TEXT    DEFAULT 'classic',
  export_font   TEXT    DEFAULT 'serif',
  target_words  INTEGER DEFAULT 80000,
  status        TEXT    DEFAULT 'drafting',
  created_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sections (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id),
  parent_id     INTEGER REFERENCES sections(id),
  type          TEXT    NOT NULL DEFAULT 'chapter',
  title         TEXT    NOT NULL DEFAULT 'Untitled',
  position      INTEGER NOT NULL DEFAULT 0,
  content       TEXT    DEFAULT '{}',
  word_count    INTEGER DEFAULT 0,
  is_included   INTEGER DEFAULT 1,
  created_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id  INTEGER NOT NULL REFERENCES sections(id),
  content     TEXT    NOT NULL,
  word_count  INTEGER DEFAULT 0,
  saved_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS custom_fonts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  family_name   TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  data_base64   TEXT NOT NULL,
  format        TEXT NOT NULL DEFAULT 'truetype',
  weight        TEXT DEFAULT '400',
  style         TEXT DEFAULT 'normal',
  created_at    TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS planning_notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL REFERENCES manuscripts(id),
  category      TEXT    NOT NULL DEFAULT 'misc',
  title         TEXT    NOT NULL,
  content       TEXT    DEFAULT '',
  color         TEXT    DEFAULT '#fef3c7',
  position_x    INTEGER DEFAULT 0,
  position_y    INTEGER DEFAULT 0,
  created_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER REFERENCES manuscripts(id),
  title         TEXT    DEFAULT 'New Conversation',
  created_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id),
  role            TEXT    NOT NULL DEFAULT 'user',
  content         TEXT    NOT NULL,
  model_used      TEXT,
  created_at      TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

const DEFAULT_SETTINGS: Record<string, string> = {
  default_font_family: 'Georgia',
  default_font_size: '14',
  ui_theme: 'dark',
  autosave_interval_ms: '30000',
  focus_mode_opacity: '0.15',
  openrouter_api_key: '',
  openrouter_model: 'openrouter/free',
  sidebar_visible: 'true',
  typesetter_visible: 'true',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rows(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown>[] {
  if (!result.length) return []
  const { columns, values } = result[0]
  return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])))
}

function firstRow(result: { columns: string[]; values: unknown[][] }[]): Record<string, unknown> | null {
  const all = rows(result)
  return all.length ? all[0] : null
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function persist(): void {
  if (!db) return
  try {
    const data = db.export()
    const base64 = uint8ToBase64(data)
    localStorage.setItem(DB_KEY, base64)
  } catch (e) {
    console.error('Failed to persist database:', e)
  }
}

function now(): string {
  return new Date().toISOString()
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`,
  })

  const saved = localStorage.getItem(DB_KEY)

  if (saved) {
    try {
      const binaryStr = atob(saved)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      db = new SQL.Database(bytes)
    } catch {
      db = new SQL.Database()
    }
  } else {
    db = new SQL.Database()
  }

  db.run(SCHEMA)

  // Seed default settings
  const insertSetting = `INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)`
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    db.run(insertSetting, [key, value])
  }

  persist()
}

export function getDb(): Database | null {
  return db
}

export { rows, firstRow, persist, now }