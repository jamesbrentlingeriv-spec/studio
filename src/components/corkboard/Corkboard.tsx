import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, Move, Palette, Trash2, Search, StickyNote, Users, BookOpen, Clock, FlaskConical, Lightbulb, Pencil } from 'lucide-react'
import { useStudioStore, type PlanningNote, type Manuscript } from '@/store/useStudioStore'

const CATEGORIES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  character:  { label: 'Characters',   icon: <Users size={13} />,        color: '#e8f0fe' },
  plot:       { label: 'Plot Points',  icon: <BookOpen size={13} />,     color: '#fce8e6' },
  timeline:   { label: 'Timeline',     icon: <Clock size={13} />,        color: '#e6f4ea' },
  research:   { label: 'Research',     icon: <FlaskConical size={13} />, color: '#fef7e0' },
  ideas:      { label: 'Ideas',        icon: <Lightbulb size={13} />,    color: '#f3e8fd' },
  misc:       { label: 'Misc',         icon: <StickyNote size={13} />,   color: '#fef3c7' },
}

const NOTE_COLORS = ['#fef3c7', '#e8f0fe', '#fce8e6', '#e6f4ea', '#f3e8fd', '#fef7e0', '#ffffff']

interface NoteCardProps {
  note: PlanningNote
  onUpdate: (id: number, data: Partial<PlanningNote>) => void
  onDelete: (id: number) => void
  onDragStart: (id: number) => void
  onDragEnd: () => void
  isDragging: boolean
}

function NoteCard({ note, onUpdate, onDelete, onDragStart, onDragEnd, isDragging }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(note.title)
  const [editContent, setEditContent] = useState(note.content)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(() => {
    onUpdate(note.id, { title: editTitle, content: editContent })
    setIsEditing(false)
  }, [note.id, editTitle, editContent, onUpdate])

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={() => onDragStart(note.id)}
      onDragEnd={onDragEnd}
      className={`absolute rounded-xl shadow-md border transition-all cursor-grab active:cursor-grabbing group ${
        isDragging ? 'shadow-xl scale-105 z-30 opacity-90 rotate-1' : 'hover:shadow-lg hover:-translate-y-0.5'
      }`}
      style={{
        left: note.position_x,
        top: note.position_y,
        width: 200,
        minHeight: 120,
        backgroundColor: note.color || '#fef3c7',
        borderColor: `${note.color || '#fef3c7'}99`,
      }}
    >
      {/* Color picker bar */}
      <div className="absolute -top-1 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-0.5 bg-white rounded-full shadow-md px-1 py-0.5 border border-gray-200">
          {NOTE_COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate(note.id, { color: c })}
              className="w-4 h-4 rounded-full border border-gray-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title="Change color"
            />
          ))}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="p-3 space-y-2">
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full text-sm font-semibold bg-transparent border-b-2 border-gray-300 focus:border-brand outline-none text-[#1a1f2e]"
            placeholder="Note title"
          />
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full text-xs bg-transparent border-b-2 border-gray-300 focus:border-brand outline-none text-[#1a1f2e] resize-none"
            rows={3}
            placeholder="Write something…"
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              className="text-[10px] font-semibold px-2 py-1 bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-[10px] font-semibold px-2 py-1 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3">
          {/* Category badge */}
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              {CATEGORIES[note.category]?.icon}
              {note.category}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-[#1a1f2e] mb-1 leading-snug">{note.title}</h3>
          {note.content && (
            <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {note.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditTitle(note.title); setEditContent(note.content); setIsEditing(true) }}
              className="p-1 rounded text-gray-400 hover:text-brand hover:bg-brand/10 transition-colors"
              title="Edit note"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete note"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Corkboard ──────────────────────────────────────────────────────────

export default function Corkboard() {
  const { activeManuscript, setView } = useStudioStore()
  return activeManuscript ? <CorkboardContent manuscript={activeManuscript} /> : (
    <div className="flex items-center justify-center h-full bg-[#f8f7f4]">
      <div className="text-center">
        <div className="text-6xl mb-4">📌</div>
        <p className="text-lg font-medium text-gray-600">Open a manuscript to use the Corkboard</p>
        <button
          onClick={() => setView('shelf')}
          className="mt-3 text-sm text-brand hover:text-brand-dark transition-colors"
        >
          ← Go to Shelf
        </button>
      </div>
    </div>
  )
}

function CorkboardContent({ manuscript }: { manuscript: Manuscript }) {
  const [notes, setNotes] = useState<PlanningNote[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  // Load notes from DB via IPC
  useEffect(() => {
    loadNotes()
  }, [manuscript.id])

  async function loadNotes() {
    const { studioApi } = await import('@/lib/studioApi')
    const ns = await studioApi.notes.getByManuscript(manuscript.id) as PlanningNote[]
    setNotes(ns)
  }

  async function handleCreateNote() {
    const { studioApi } = await import('@/lib/studioApi')
    // Random position in the visible area
    const x = 40 + Math.random() * 400
    const y = 40 + Math.random() * 300
    const note = await studioApi.notes.create({
      manuscript_id: manuscript.id,
      category: 'misc',
      title: 'New Note',
      content: '',
      color: '#fef3c7',
      position_x: x,
      position_y: y,
    }) as unknown as PlanningNote
    setNotes(prev => [...prev, note])
  }

  async function handleUpdate(id: number, data: Partial<PlanningNote>) {
    const { studioApi } = await import('@/lib/studioApi')
    await studioApi.notes.update(id, data)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
  }

  async function handleDelete(id: number) {
    const { studioApi } = await import('@/lib/studioApi')
    await studioApi.notes.delete(id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // Drag and drop
  function handleDragStart(id: number) {
    setDraggingId(id)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (draggingId === null || !boardRef.current) return

    const boardRect = boardRef.current.getBoundingClientRect()
    const x = e.clientX - boardRect.left - dragOffset.current.x
    const y = e.clientY - boardRect.top - dragOffset.current.y

    setNotes(prev => prev.map(n =>
      n.id === draggingId ? { ...n, position_x: Math.round(x), position_y: Math.round(y) } : n
    ))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (draggingId === null || !boardRef.current) return

    const boardRect = boardRef.current.getBoundingClientRect()
    const x = e.clientX - boardRect.left - dragOffset.current.x
    const y = e.clientY - boardRect.top - dragOffset.current.y

    // Persist position
    handleUpdate(draggingId, { position_x: Math.round(x), position_y: Math.round(y) })
    setDraggingId(null)
  }

  // Filter + search
  const filteredNotes = notes.filter(n => {
    if (filterCategory !== 'all' && n.category !== filterCategory) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    }
    return true
  })

  const categoryCounts: Record<string, number> = {}
  for (const n of notes) {
    categoryCounts[n.category] = (categoryCounts[n.category] ?? 0) + 1
  }

  return (
    <div className="h-full flex flex-col bg-[#f8f7f4]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-[#1a1f2e] flex items-center gap-2">
              <StickyNote size={20} className="text-brand" />
              Corkboard
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {manuscript.title} · {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </p>
          </div>

          <button
            onClick={handleCreateNote}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors shadow-sm"
          >
            <Plus size={15} />
            New Note
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand/30 text-[#1a1f2e] transition-all"
            />
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterCategory('all')}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                filterCategory === 'all'
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All ({notes.length})
            </button>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                  filterCategory === key
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat.icon}
                {cat.label} ({categoryCounts[key] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board area */}
      <div
        ref={boardRef}
        className="flex-1 relative overflow-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          backgroundImage: `
            radial-gradient(circle, #e0dcd3 1px, transparent 1px),
            linear-gradient(to bottom, #f2efe8, #ede9e1)
          `,
          backgroundSize: '20px 20px, 100% 100%',
          minHeight: 600,
        }}
      >
        {filteredNotes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            isDragging={draggingId === note.id}
          />
        ))}

        {filteredNotes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-3 opacity-40">📌</div>
              <p className="text-gray-400 font-medium">
                {notes.length === 0
                  ? 'Your corkboard is empty. Create your first note to start planning!'
                  : 'No notes match your filter.'}
              </p>
              {notes.length === 0 && (
                <button
                  onClick={handleCreateNote}
                  className="mt-3 text-sm text-brand hover:text-brand-dark transition-colors font-medium"
                >
                  + Add a note
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}