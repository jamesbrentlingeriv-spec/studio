import { useState } from 'react'
import {
  Plus, ChevronDown, ChevronRight, Trash2, FilePlus,
  FileText, BookOpen, BookMarked, AlignLeft, Minus
} from 'lucide-react'
import { useStudioStore, type Section } from '@/store/useStudioStore'

const SECTION_ICONS: Record<string, React.ReactNode> = {
  title_page: <FileText size={12} />,
  dedication: <BookMarked size={12} />,
  epigraph: <AlignLeft size={12} />,
  table_of_contents: <AlignLeft size={12} />,
  preface: <FileText size={12} />,
  introduction: <FileText size={12} />,
  chapter: <BookOpen size={12} />,
  scene: <Minus size={12} />,
  epilogue: <FileText size={12} />,
  afterword: <FileText size={12} />,
  acknowledgments: <FileText size={12} />,
  bibliography: <FileText size={12} />,
  about_author: <FileText size={12} />,
  copyright: <FileText size={12} />,
}

const FRONT_MATTER_TYPES = [
  'title_page', 'dedication', 'epigraph', 'table_of_contents', 'preface', 'introduction'
] as const

const BACK_MATTER_TYPES = [
  'epilogue', 'afterword', 'acknowledgments', 'bibliography', 'about_author', 'copyright'
] as const

type SectionType = 'front_matter' | 'chapter' | 'scene' | 'back_matter'

export default function ManuscriptNavigator() {
  const {
    activeManuscript,
    sections,
    activeSectionId,
    setActiveSectionId,
    createSection,
    deleteSection,
    updateSection,
    chaptersOpen,
    setChaptersOpen,
  } = useStudioStore()

  const [showAddMenu, setShowAddMenu] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (!activeManuscript) return null

  // Separate sections by kind
  const frontMatter = sections.filter(s =>
    FRONT_MATTER_TYPES.includes(s.type as typeof FRONT_MATTER_TYPES[number])
  )
  const chapters = sections.filter(s => s.type === 'chapter')
  const backMatter = sections.filter(s =>
    BACK_MATTER_TYPES.includes(s.type as typeof BACK_MATTER_TYPES[number])
  )

  async function addChapter() {
    const chapterNum = chapters.length + 1
    const section = await createSection({
      manuscript_id: activeManuscript!.id,
      type: 'chapter',
      title: `Chapter ${chapterNum}`,
    })
    setActiveSectionId((section as Section).id)
    setShowAddMenu(false)
  }

  async function addFrontMatter(type: string) {
    const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const section = await createSection({
      manuscript_id: activeManuscript!.id,
      type,
      title: label,
    })
    setActiveSectionId((section as Section).id)
    setShowAddMenu(false)
  }

  function startRename(section: Section) {
    setEditingId(section.id)
    setEditingTitle(section.title)
  }

  async function saveRename(sectionId: number) {
    if (editingTitle.trim()) {
      await updateSection(sectionId, { title: editingTitle.trim() })
    }
    setEditingId(null)
  }

  function toggleCollapse(key: string) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }))
  }

  function SectionRow({ section }: { section: Section }) {
    const isActive = activeSectionId === section.id
    const isEditing = editingId === section.id

    return (
      <div
        className={`
          group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer
          text-xs transition-all
          ${isActive
            ? 'bg-neutral-800 text-white'
            : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
          }
        `}
        onClick={() => {
          if (!isEditing) {
            setActiveSectionId(section.id)
            setChaptersOpen(false)
          }
        }}
        onDoubleClick={() => startRename(section)}
      >
        <span className="flex-shrink-0 opacity-60">
          {SECTION_ICONS[section.type] ?? <FileText size={12} />}
        </span>

        {isEditing ? (
          <input
            autoFocus
            value={editingTitle}
            onChange={e => setEditingTitle(e.target.value)}
            onBlur={() => saveRename(section.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') saveRename(section.id)
              if (e.key === 'Escape') setEditingId(null)
            }}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-sidebar-active text-white text-xs px-1 py-0.5 rounded outline-none"
          />
        ) : (
          <span className="flex-1 truncate">{section.title}</span>
        )}

        {/* Word count */}
        <span className="opacity-30 text-[10px] flex-shrink-0 group-hover:opacity-50">
          {section.word_count > 0 ? section.word_count.toLocaleString() : ''}
        </span>

        {/* Delete button — shows on hover */}
        <button
          onClick={async (e) => {
            e.stopPropagation()
            if (window.confirm(`Delete "${section.title}"?`)) {
              await deleteSection(section.id)
            }
          }}
          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-red-400 transition-opacity flex-shrink-0"
        >
          <Trash2 size={11} />
        </button>
      </div>
    )
  }

  function SectionGroup({
    label, items, collapsedKey
  }: { label: string; items: Section[]; collapsedKey: string }) {
    if (items.length === 0) return null
    const isCollapsed = collapsed[collapsedKey]
    return (
      <div className="mb-1">
        <button
          onClick={() => toggleCollapse(collapsedKey)}
          className="w-full flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-sidebar-text/50 hover:text-sidebar-text transition-colors"
        >
          {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
          {label}
        </button>
        {!isCollapsed && (
          <div className="space-y-0.5">
            {items.map(s => <SectionRow key={s.id} section={s} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`chapters-sidebar w-48 flex-shrink-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full transition-transform duration-300 z-40 md:relative md:translate-x-0 ${chaptersOpen ? 'fixed top-8 bottom-0 left-0 translate-x-0' : 'fixed top-8 bottom-0 left-0 -translate-x-full md:translate-x-0'}`}>
      {/* Navigator Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-sidebar-border flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-text/60">
          Manuscript
        </span>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 text-sidebar-text hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-sidebar-hover transition-colors"
            title="Add section"
          >
            <Plus size={12} />
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-6 bg-[#1e2538] border border-sidebar-border rounded-lg shadow-xl py-1 z-50 w-44 animate-slide-up">
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-sidebar-text/40 font-bold">Add</p>
              <button
                onClick={addChapter}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
              >
                <BookOpen size={12} /> Chapter
              </button>
              <div className="border-t border-sidebar-border my-1" />
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-sidebar-text/40 font-bold">Front Matter</p>
              {FRONT_MATTER_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => addFrontMatter(type)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors capitalize"
                >
                  {SECTION_ICONS[type]} {type.replace(/_/g, ' ')}
                </button>
              ))}
              <div className="border-t border-sidebar-border my-1" />
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-sidebar-text/40 font-bold">Back Matter</p>
              {BACK_MATTER_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => addFrontMatter(type)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors capitalize"
                >
                  {SECTION_ICONS[type]} {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 space-y-1">
        <SectionGroup label="Front Matter" items={frontMatter} collapsedKey="front" />
        <SectionGroup label="Chapters" items={chapters} collapsedKey="chapters" />
        <SectionGroup label="Back Matter" items={backMatter} collapsedKey="back" />

        {sections.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[10px] text-sidebar-text/40">No sections yet</p>
            <button
              onClick={addChapter}
              className="mt-2 flex items-center gap-1 text-xs text-brand hover:text-brand-light transition-colors mx-auto"
            >
              <Plus size={11} /> Add chapter
            </button>
          </div>
        )}
      </div>

      {/* Total word count */}
      <div className="border-t border-sidebar-border px-3 py-2 flex-shrink-0">
        <p className="text-[10px] text-sidebar-text/40">
          {sections.reduce((sum, s) => sum + s.word_count, 0).toLocaleString()} / {activeManuscript.target_words.toLocaleString()} words
        </p>
        <div className="h-1 bg-sidebar-active rounded-full mt-1 overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, (sections.reduce((s, sec) => s + sec.word_count, 0) / activeManuscript.target_words) * 100)}%`
            }}
          />
        </div>
      </div>
    </div>
  )
}
