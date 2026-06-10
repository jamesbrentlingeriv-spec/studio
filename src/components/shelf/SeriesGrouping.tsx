import { useState } from 'react'
import { ChevronDown, ChevronRight, BookMarked } from 'lucide-react'
import { type Manuscript, type Series } from '@/store/useStudioStore'
import BookCard from './BookCard'

interface Props {
  series: Series
  books: Manuscript[]
  viewMode: 'grid' | 'list'
}

export default function SeriesGrouping({ series, books, viewMode }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const sortedBooks = [...books].sort((a, b) => a.series_order - b.series_order)
  const totalWords = books.reduce((sum, ms) => sum + (ms.word_count ?? 0), 0)

  return (
    <section className="animate-fade-in">
      {/* Series header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 mb-4 w-full text-left group"
      >
        <div className="flex items-center gap-2">
          <BookMarked size={16} className="text-brand" />
          <h2 className="text-base font-bold text-[#1a1f2e]">{series.title}</h2>
          <span className="text-xs text-gray-400 font-normal">
            {books.length} {books.length === 1 ? 'book' : 'books'} · {totalWords.toLocaleString()} words
          </span>
        </div>
        <span className="text-gray-400 ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Series divider line */}
      <div className="h-px bg-gradient-to-r from-brand/40 via-brand/10 to-transparent mb-4" />

      {!collapsed && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
          : 'flex flex-col gap-3'
        }>
          {sortedBooks.map(ms => (
            <BookCard
              key={ms.id}
              manuscript={ms}
              viewMode={viewMode}
              seriesOrder={ms.series_order}
            />
          ))}
        </div>
      )}
    </section>
  )
}
