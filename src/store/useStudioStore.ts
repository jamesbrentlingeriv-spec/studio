import { create } from 'zustand'
import { studioApi } from '@/lib/studioApi'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Manuscript = {
  id: number
  series_id: number | null
  series_order: number
  title: string
  subtitle: string | null
  author: string | null
  description: string | null
  genre: string | null
  cover_path: string | null
  trim_size: string
  theme: string
  export_font: 'serif' | 'sans'
  target_words: number
  status: string
  created_at: string
  updated_at: string
  word_count?: number
}

export type Series = {
  id: number
  title: string
  description: string | null
  cover_path: string | null
  created_at: string
}

export type Section = {
  id: number
  manuscript_id: number
  parent_id: number | null
  type: string
  title: string
  position: number
  content: string
  word_count: number
  is_included: number
  created_at: string
  updated_at: string
}

export type CustomFont = {
  id: number
  family_name: string
  file_name: string
  file_path: string
  format: string
  weight: string
  style: string
  created_at: string
}

export type PlanningNote = {
  id: number
  manuscript_id: number
  category: string
  title: string
  content: string
  color: string
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

export type AIMessage = {
  id: number
  conversation_id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  model_used: string | null
  created_at: string
}

export type AIConversation = {
  id: number
  manuscript_id: number | null
  title: string
  created_at: string
}

export type AppView = 'shelf' | 'editor' | 'corkboard' | 'ai' | 'settings'

// ─── Store ────────────────────────────────────────────────────────────────────

type StudioStore = {
  // Navigation
  currentView: AppView
  setView: (view: AppView) => void

  // Shelf
  manuscripts: Manuscript[]
  series: Series[]
  coverCache: Record<string, string>  // coverPath -> dataUrl
  fetchManuscripts: () => Promise<void>
  fetchSeries: () => Promise<void>
  fetchCover: (coverPath: string) => Promise<string>
  createManuscript: (data: Partial<Manuscript>) => Promise<Manuscript>
  updateManuscript: (id: number, data: Partial<Manuscript>) => Promise<void>
  deleteManuscript: (id: number) => Promise<void>
  createSeries: (data: Partial<Series>) => Promise<Series>

  // Editor
  activeManuscript: Manuscript | null
  activeSectionId: number | null
  sections: Section[]
  setActiveManuscript: (manuscript: Manuscript | null) => void
  setActiveSectionId: (id: number | null) => void
  fetchSections: (manuscriptId: number) => Promise<void>
  createSection: (data: Partial<Section>) => Promise<Section>
  updateSection: (id: number, data: Partial<Section>) => Promise<void>
  deleteSection: (id: number) => Promise<void>
  saveContent: (sectionId: number, content: string, wordCount: number) => Promise<void>

  // Custom fonts
  customFonts: CustomFont[]
  fetchFonts: () => Promise<void>
  importFont: (file: File) => Promise<CustomFont>

  // AI Chat
  aiConversations: AIConversation[]
  activeConversationId: number | null
  aiMessages: AIMessage[]
  isChatOpen: boolean
  isAILoading: boolean
  setChatOpen: (open: boolean) => void
  setActiveConversation: (id: number | null) => void
  fetchConversations: (manuscriptId?: number) => Promise<void>
  fetchMessages: (conversationId: number) => Promise<void>
  createConversation: (manuscriptId?: number) => Promise<AIConversation>
  sendMessage: (content: string, model?: string) => Promise<void>
  addOptimisticMessage: (message: AIMessage) => void

  // Settings
  settings: Record<string, string>
  fetchSettings: () => Promise<void>
  setSetting: (key: string, value: string) => Promise<void>
}

// ─── Zustand Store ────────────────────────────────────────────────────────────

export const useStudioStore = create<StudioStore>((set, get) => ({
  // Navigation
  currentView: 'shelf',
  setView: (view) => set({ currentView: view }),

  // Shelf state
  manuscripts: [],
  series: [],
  coverCache: {},

  fetchManuscripts: async () => {
    const manuscripts = await studioApi.manuscripts.getAll() as Manuscript[]
    set({ manuscripts })
  },

  fetchSeries: async () => {
    const series = await studioApi.series.getAll() as Series[]
    set({ series })
  },

  fetchCover: async (coverPath) => {
    const { coverCache } = get()
    if (coverCache[coverPath]) return coverCache[coverPath]
    const dataUrl = await studioApi.covers.getDataUrl(coverPath)
    if (dataUrl) {
      set({ coverCache: { ...coverCache, [coverPath]: dataUrl } })
      return dataUrl
    }
    return ''
  },

  createManuscript: async (data) => {
    const ms = await studioApi.manuscripts.create(data)
    await get().fetchManuscripts()
    return ms as Manuscript
  },

  updateManuscript: async (id, data) => {
    await studioApi.manuscripts.update(id, data)
    await get().fetchManuscripts()
    // Also update activeManuscript if it's the one being edited
    const { activeManuscript } = get()
    if (activeManuscript?.id === id) {
      set({ activeManuscript: { ...activeManuscript, ...data } as Manuscript })
    }
  },

  deleteManuscript: async (id) => {
    await studioApi.manuscripts.delete(id)
    await get().fetchManuscripts()
    if (get().activeManuscript?.id === id) {
      set({ activeManuscript: null, activeSectionId: null, sections: [] })
    }
  },

  createSeries: async (data) => {
    const s = await studioApi.series.create(data)
    await get().fetchSeries()
    return s as Series
  },

  // Editor state
  activeManuscript: null,
  activeSectionId: null,
  sections: [],

  setActiveManuscript: (manuscript) => {
    set({ activeManuscript: manuscript, activeSectionId: null, sections: [] })
    if (manuscript) get().fetchSections(manuscript.id)
  },

  setActiveSectionId: (id) => set({ activeSectionId: id }),

  fetchSections: async (manuscriptId) => {
    const sections = await studioApi.sections.getByManuscript(manuscriptId) as Section[]
    set({ sections })
  },

  createSection: async (data) => {
    const section = await studioApi.sections.create(data)
    await get().fetchSections(data.manuscript_id as number)
    return section as Section
  },

  updateSection: async (id, data) => {
    await studioApi.sections.update(id, data)
    const { activeManuscript } = get()
    if (activeManuscript) await get().fetchSections(activeManuscript.id)
  },

  deleteSection: async (id) => {
    await studioApi.sections.delete(id)
    const { activeManuscript, activeSectionId } = get()
    if (activeManuscript) await get().fetchSections(activeManuscript.id)
    if (activeSectionId === id) set({ activeSectionId: null })
  },

  saveContent: async (sectionId, content, wordCount) => {
    await studioApi.sections.saveContent(sectionId, content, wordCount)
    set(state => ({
      sections: state.sections.map(s =>
        s.id === sectionId ? { ...s, word_count: wordCount } : s
      ),
      activeManuscript: state.activeManuscript
        ? { ...state.activeManuscript, word_count: (state.activeManuscript.word_count ?? 0) }
        : null,
    }))
  },

  // Custom fonts
  customFonts: [],

  fetchFonts: async () => {
    const fonts = await studioApi.fonts.getAll()
    set({ customFonts: fonts as CustomFont[] })
    // Inject @font-face for each custom font
    for (const font of fonts as CustomFont[]) {
      injectFontFace(font as CustomFont)
    }
  },

  importFont: async (file: File) => {
    const font = await studioApi.fonts.import(file)
    injectFontFace(font as CustomFont)
    await get().fetchFonts()
    return font as CustomFont
  },

  // AI Chat state
  aiConversations: [],
  activeConversationId: null,
  aiMessages: [],
  isChatOpen: false,
  isAILoading: false,

  setChatOpen: (open) => set({ isChatOpen: open }),
  setActiveConversation: (id) => {
    set({ activeConversationId: id, aiMessages: [] })
    if (id) get().fetchMessages(id)
  },

  fetchConversations: async (manuscriptId) => {
    const convs = await studioApi.ai.getConversations(manuscriptId)
    set({ aiConversations: convs as AIConversation[] })
  },

  fetchMessages: async (conversationId) => {
    const msgs = await studioApi.ai.getMessages(conversationId)
    set({ aiMessages: msgs as AIMessage[] })
  },

  createConversation: async (manuscriptId) => {
    const conv = await studioApi.ai.createConversation(manuscriptId)
    set({ activeConversationId: (conv as AIConversation).id, aiMessages: [] })
    await get().fetchConversations(manuscriptId)
    return conv as AIConversation
  },

  addOptimisticMessage: (message) => {
    set(state => ({ aiMessages: [...state.aiMessages, message] }))
  },

  sendMessage: async (content, model) => {
    const { activeConversationId, aiMessages, settings } = get()
    if (!activeConversationId) return

    const selectedModel = model ?? settings.openrouter_model ?? 'mistralai/mistral-7b-instruct:free'

    // Save user message to DB and add to UI
    const userMsg = await studioApi.ai.saveMessage(activeConversationId, 'user', content)
    set(state => ({ aiMessages: [...state.aiMessages, userMsg as AIMessage], isAILoading: true }))

    try {
      // Build message history for context
      const contextMessages = [...aiMessages, userMsg as AIMessage].map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      // Optimistic streaming assistant message
      const tempId = Date.now()
      const streamingMsg: AIMessage = {
        id: tempId,
        conversation_id: activeConversationId,
        role: 'assistant',
        content: '',
        model_used: selectedModel,
        created_at: new Date().toISOString(),
      }
      set(state => ({ aiMessages: [...state.aiMessages, streamingMsg] }))

      let fullContent = ''

      await studioApi.ai.streamChat(contextMessages, selectedModel, (chunk: string | null) => {
        if (chunk === null) return
        fullContent += chunk
        set(state => ({
          aiMessages: state.aiMessages.map(m =>
            m.id === tempId ? { ...m, content: fullContent } : m
          ),
        }))
      })

      // Persist the completed message
      const savedMsg = await studioApi.ai.saveMessage(activeConversationId, 'assistant', fullContent, selectedModel)
      set(state => ({
        aiMessages: state.aiMessages.map(m =>
          m.id === tempId ? { ...(savedMsg as AIMessage), content: fullContent } : m
        ),
        isAILoading: false,
      }))
    } catch (err) {
      console.error('AI chat error:', err)
      const errorMsg: AIMessage = {
        id: Date.now(),
        conversation_id: activeConversationId,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
        model_used: null,
        created_at: new Date().toISOString(),
      }
      set(state => ({ aiMessages: [...state.aiMessages, errorMsg], isAILoading: false }))
    }
  },

  // Settings
  settings: {},

  fetchSettings: async () => {
    const settings = await studioApi.settings.getAll()
    set({ settings })
  },

  setSetting: async (key, value) => {
    await studioApi.settings.set(key, value)
    set(state => ({ settings: { ...state.settings, [key]: value } }))
  },
}))

// ─── Font Injection Helper ─────────────────────────────────────────────────────

const injectedFonts = new Set<string>()

function injectFontFace(font: CustomFont): void {
  if (injectedFonts.has(font.file_path)) return
  injectedFonts.add(font.file_path)

  // In Electron, file:// protocol can access userData — but we use base64 if needed.
  // For simplicity, use file:// path directly (allowed by CSP in dev mode).
  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: "${font.family_name}";
      src: url("file://${font.file_path.replace(/\\/g, '/')}") format("${font.format}");
      font-weight: ${font.weight};
      font-style: ${font.style};
      font-display: swap;
    }
  `
  document.head.appendChild(style)
}
