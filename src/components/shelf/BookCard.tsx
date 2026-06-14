import { useEffect, useState } from 'react'
import { useStudioStore, type Manuscript } from '@/store/useStudioStore'
import { BookOpen, MoreVertical, Trash2, Pencil } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  idea: 'bg-neutral-100 text-neutral-600',
  drafting: 'bg-neutral-200 text-neutral-800',
  revising: 'bg-neutral-300 text-neutral-900',
  complete: 'bg-neutral-800 text-white',
  published: 'bg-black text-white',
}

const COVER_PLACEHOLDERS = [
  'from-neutral-200 to-neutral-400',
  'from-neutral-300 to-neutral-500',
  'from-neutral-400 to-neutral-600',
  'from-neutral-500 to-neutral-700',
  'from-neutral-600 to-neutral-800',
  'from-neutral-700 to-neutral-900',
]

interface Props {
  manuscript: Manuscript
  viewMode: 'grid' | 'list'
  seriesOrder?: number
}

export default function BookCard({ manuscript, viewMode, seriesOrder }: Props) {
  const { setActiveManuscript, setView, deleteManuscript, fetchCover } = useStudioStore()
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pick a consistent placeholder gradient based on manuscript ID
  const gradientClass = COVER_PLACEHOLDERS[manuscript.id % COVER_PLACEHOLDERS.length]

  useEffect(() => {
    if (manuscript.cover_path) {
      fetchCover(manuscript.cover_path).then(url => {
        if (url) setCoverDataUrl(url)
      })
    }
  }, [manuscript.cover_path])

  function openEditor() {
    setActiveManuscript(manuscript)
    setView('editor')
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${manuscript.title}"? This cannot be undone.`)) return
    setIsDeleting(true)
    await deleteManuscript(manuscript.id)
  }

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm
          border border-gray-100 hover:shadow-md hover:border-brand/30 transition-all
          cursor-pointer group animate-fade-in"
        onClick={openEditor}
      >
        {/* Mini cover */}
        <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
          {coverDataUrl ? (
            <img src={coverDataUrl} alt={manuscript.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-b ${gradientClass} flex items-center justify-center`}>
              <BookOpen size={14} className="text-white/60" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1a1f2e] truncate text-sm">{manuscript.title}</h3>
            {seriesOrder && (
              <span className="text-xs text-gray-400 flex-shrink-0">#{seriesOrder}</span>
            )}
          </div>
          {manuscript.author && (
            <p className="text-xs text-gray-500 truncate">{manuscript.author}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-400">{manuscript.word_count?.toLocaleString() ?? 0} words</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_COLORS[manuscript.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {manuscript.status}
          </span>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="group relative animate-fade-in">
      {/* Book Cover */}
      <div
        onClick={openEditor}
        className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer
          shadow-book-card hover:shadow-book-hover transition-all duration-300
          hover:-translate-y-1.5"
      >
        {coverDataUrl ? (
          <img src={coverDataUrl} alt={manuscript.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${gradientClass} flex flex-col items-center justify-center p-3`}>
            <BookOpen size={28} className="text-white/40 mb-3" />
            <p className="text-white text-center text-xs font-bold leading-snug line-clamp-3">
              {manuscript.title}
            </p>
            {manuscript.author && (
              <p className="text-white/60 text-center text-[10px] mt-1 truncate w-full text-center">
                {manuscript.author}
              </p>
            )}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white/95 text-[#1a1f2e] text-xs font-bold px-3 py-1.5 rounded-full shadow">
              Open
            </div>
          </div>
        </div>

        {/* Series order badge */}
        {seriesOrder && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            #{seriesOrder}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute bottom-2 left-2 right-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${STATUS_COLORS[manuscript.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {manuscript.status}
          </span>
        </div>
      </div>

      {/* Book Info */}
      <div className="mt-2 px-0.5">
        <h3 className="font-semibold text-[#1a1f2e] text-sm leading-tight line-clamp-2">
          {manuscript.title}
        </h3>
        {manuscript.author && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{manuscript.author}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5">
          {manuscript.word_count?.toLocaleString() ?? 0} words
        </p>
      </div>

      {/* Context Menu Button */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="bg-black/60 hover:bg-black/80 text-white rounded p-1 transition-colors"
          >
            <MoreVertical size={12} />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-7 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 w-36 animate-slide-up"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); openEditor(); setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <BookOpen size={14} /> Open
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); /* TODO: rename */ setShowMenu(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={14} /> Rename
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); setShowMenu(false) }}
                disabled={isDeleting}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
