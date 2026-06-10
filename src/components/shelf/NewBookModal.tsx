import { useState } from 'react'
import { useStudioStore } from '@/store/useStudioStore'
import { studioApi } from '@/lib/studioApi'
import { X, Upload, BookOpen, Plus } from 'lucide-react'

const GENRES = [
  'Literary Fiction', 'Fantasy', 'Science Fiction', 'Mystery', 'Thriller',
  'Romance', 'Horror', 'Historical Fiction', 'Young Adult', 'Children\'s',
  'Non-Fiction', 'Memoir', 'Biography', 'Self-Help', 'Other',
]

const TRIM_SIZES = [
  { value: '6x9',    label: 'Trade Paperback (6" × 9")' },
  { value: '5.5x8.5', label: 'Digest (5.5" × 8.5")' },
  { value: '5x8',    label: 'Pocket (5" × 8")' },
  { value: '8.5x11', label: 'Letter (8.5" × 11")' },
]

interface Props {
  onClose: () => void
}

export default function NewBookModal({ onClose }: Props) {
  const { createManuscript, createSeries, series, setActiveManuscript, setView } = useStudioStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [trimSize, setTrimSize] = useState('6x9')
  const [exportFont, setExportFont] = useState<'serif' | 'sans'>('serif')
  const [targetWords, setTargetWords] = useState(80000)
  const [seriesId, setSeriesId] = useState<number | null>(null)
  const [seriesOrder, setSeriesOrder] = useState(1)
  const [newSeriesTitle, setNewSeriesTitle] = useState('')
  const [showNewSeries, setShowNewSeries] = useState(false)
  const [coverPath, setCoverPath] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleCoverUpload() {
    const filePath = await studioApi.covers.openDialog()
    if (!filePath) return
    const destPath = await studioApi.covers.import(filePath)
    setCoverPath(destPath)
    const dataUrl = await studioApi.covers.getDataUrl(destPath)
    setCoverPreview(dataUrl)
  }

  async function handleCreate() {
    if (!title.trim()) return
    setIsCreating(true)

    try {
      let finalSeriesId = seriesId
      if (showNewSeries && newSeriesTitle.trim()) {
        const newS = await createSeries({ title: newSeriesTitle.trim() })
        finalSeriesId = newS.id
      }

      const ms = await createManuscript({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        author: author.trim() || undefined,
        genre: genre || undefined,
        trim_size: trimSize,
        export_font: exportFont,
        target_words: targetWords,
        cover_path: coverPath ?? undefined,
        series_id: finalSeriesId ?? undefined,
        series_order: seriesOrder,
      })

      // Immediately open the new manuscript
      setActiveManuscript(ms)
      setView('editor')
      onClose()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-slide-up">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#1a1f2e]">
            {step === 1 ? 'New Book' : 'Cover & Series'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex px-6 pt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-brand text-white' : 'bg-brand/20 text-brand'}`}>1</div>
            <span className={step === 1 ? 'text-brand font-medium' : 'text-gray-400'}>Details</span>
            <div className="w-8 h-px bg-gray-200 mx-1" />
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
            <span className={step === 2 ? 'text-brand font-medium' : 'text-gray-400'}>Cover & Series</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto allow-select">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  autoFocus
                  type="text"
                  placeholder="The Silent Horizon"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author Name</label>
                <input
                  type="text"
                  placeholder="Your name or pen name"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                  <select
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] bg-white transition-all"
                  >
                    <option value="">Select genre…</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Word Count</label>
                  <input
                    type="number"
                    min={1000}
                    max={500000}
                    step={5000}
                    value={targetWords}
                    onChange={e => setTargetWords(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Print Trim Size</label>
                  <select
                    value={trimSize}
                    onChange={e => setTrimSize(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] bg-white transition-all"
                  >
                    {TRIM_SIZES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Font</label>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setExportFont('serif')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${exportFont === 'serif' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span style={{ fontFamily: 'Georgia, serif' }}>Serif</span>
                    </button>
                    <button
                      onClick={() => setExportFont('sans')}
                      className={`flex-1 py-2.5 text-sm font-medium transition-colors ${exportFont === 'sans' ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span style={{ fontFamily: 'Inter, sans-serif' }}>Sans</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Cover Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Book Cover</label>
                <div className="flex gap-4 items-start">
                  <div
                    onClick={handleCoverUpload}
                    className="w-24 h-36 rounded-lg border-2 border-dashed border-gray-200 hover:border-brand
                      flex flex-col items-center justify-center cursor-pointer transition-colors
                      bg-gray-50 hover:bg-blue-50 flex-shrink-0 overflow-hidden"
                  >
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-400 text-center px-1">Click to upload</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 pt-2">
                    <p className="font-medium text-gray-700 mb-1">Cover Image</p>
                    <p>Upload a JPG, PNG, or WebP image.</p>
                    <p className="mt-1 text-[11px] opacity-70">Recommended: 1600×2400px (2:3 ratio)</p>
                    {coverPreview && (
                      <button
                        onClick={() => { setCoverPath(null); setCoverPreview(null) }}
                        className="mt-2 text-red-500 hover:text-red-600 text-xs"
                      >
                        Remove cover
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Series */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Series (Optional)</label>

                {!showNewSeries ? (
                  <div className="flex gap-2">
                    <select
                      value={seriesId ?? ''}
                      onChange={e => setSeriesId(e.target.value ? Number(e.target.value) : null)}
                      className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] bg-white transition-all"
                    >
                      <option value="">Standalone book (no series)</option>
                      {series.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowNewSeries(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 whitespace-nowrap"
                    >
                      <Plus size={14} /> New series
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Series name…"
                      value={newSeriesTitle}
                      onChange={e => setNewSeriesTitle(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                    />
                    <button
                      onClick={() => { setShowNewSeries(false); setNewSeriesTitle('') }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      ← Back to existing series
                    </button>
                  </div>
                )}

                {(seriesId || showNewSeries) && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Number in Series</label>
                    <input
                      type="number"
                      min={1}
                      value={seriesOrder}
                      onChange={e => setSeriesOrder(Number(e.target.value))}
                      className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand text-[#1a1f2e] transition-all"
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-brand text-white text-sm font-semibold
                rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating || !title.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-brand text-white text-sm font-semibold
                rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <BookOpen size={15} />
              {isCreating ? 'Creating…' : 'Create Book'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
