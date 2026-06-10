import { useState } from 'react'
import { useStudioStore } from '@/store/useStudioStore'
import BookCard from './BookCard'
import SeriesGrouping from './SeriesGrouping'
import NewBookModal from './NewBookModal'
import { Plus, LayoutGrid, List, BookMarked } from 'lucide-react'

type ViewMode = 'grid' | 'list'
type Filter = 'all' | 'standalone' | 'series'

export default function BookShelf() {
  const { manuscripts, series } = useStudioStore()
  const [showNewModal, setShowNewModal] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Group manuscripts by series
  const seriesMap = new Map<number, typeof manuscripts>()
  const standalone: typeof manuscripts = []

  for (const ms of manuscripts) {
    if (ms.series_id) {
      const group = seriesMap.get(ms.series_id) ?? []
      group.push(ms)
      seriesMap.set(ms.series_id, group)
    } else {
      standalone.push(ms)
    }
  }

  // Filter + search
  const query = searchQuery.toLowerCase()
  const filteredStandalone = standalone.filter(ms =>
    !query || ms.title.toLowerCase().includes(query) || ms.author?.toLowerCase().includes(query)
  )

  const filteredSeries = series.filter(s =>
    !query || s.title.toLowerCase().includes(query)
  )

  const showStandalone = filter !== 'series'
  const showSeries = filter !== 'standalone'

  const totalBooks = manuscripts.length
  const totalWords = manuscripts.reduce((sum, ms) => sum + (ms.word_count ?? 0), 0)

  return (
    <div className="h-full flex flex-col bg-[#f8f7f4]">
      {/* Shelf Header */}
      <div className="border-b border-panel-border bg-white px-8 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1f2e] tracking-tight flex items-center gap-2">
            <BookMarked size={22} className="text-brand" />
            My Shelf
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalBooks} {totalBooks === 1 ? 'book' : 'books'} · {totalWords.toLocaleString()} words total
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search titles, authors…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-52 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50
              focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand
              placeholder:text-gray-400 text-[#1a1f2e] transition-all"
          />

          {/* Filter tabs */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {(['all', 'standalone', 'series'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 transition-colors capitalize ${
                  filter === f
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-brand text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-brand text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
              <List size={14} />
            </button>
          </div>

          {/* New Book */}
          <button
            id="new-book-btn"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-brand hover:bg-brand-dark
              text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Book
          </button>
        </div>
      </div>

      {/* Shelf Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 allow-select">
        {manuscripts.length === 0 ? (
          <EmptyShelf onNew={() => setShowNewModal(true)} />
        ) : (
          <div className="space-y-10">
            {/* Series Groups */}
            {showSeries && filteredSeries.map(s => {
              const books = seriesMap.get(s.id) ?? []
              if (books.length === 0) return null
              return (
                <SeriesGrouping
                  key={s.id}
                  series={s}
                  books={books}
                  viewMode={viewMode}
                />
              )
            })}

            {/* Standalone Books */}
            {showStandalone && filteredStandalone.length > 0 && (
              <section>
                {showSeries && series.length > 0 && (
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
                    Standalone
                  </h2>
                )}
                <div className={viewMode === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6'
                  : 'flex flex-col gap-3'
                }>
                  {filteredStandalone.map(ms => (
                    <BookCard key={ms.id} manuscript={ms} viewMode={viewMode} />
                  ))}
                </div>
              </section>
            )}

            {filteredStandalone.length === 0 && filteredSeries.length === 0 && searchQuery && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg">No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showNewModal && <NewBookModal onClose={() => setShowNewModal(false)} />}
    </div>
  )
}

function EmptyShelf({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
      <div className="text-8xl mb-6 opacity-20">📚</div>
      <h2 className="text-2xl font-bold text-gray-700 mb-2">Your shelf is empty</h2>
      <p className="text-gray-500 mb-8 max-w-xs">
        Start your first manuscript and build your library one chapter at a time.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-6 py-3 bg-brand text-white font-semibold
          rounded-xl shadow-lg hover:bg-brand-dark transition-all hover:shadow-xl hover:-translate-y-0.5"
      >
        <Plus size={20} />
        Create Your First Book
      </button>
    </div>
  )
}
