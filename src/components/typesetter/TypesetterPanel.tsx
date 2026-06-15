import { useState, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { useStudioStore } from '@/store/useStudioStore'
import { studioApi } from '@/lib/studioApi'
import {
  BookOpen, Download, FileText, ChevronDown, ChevronUp, Check, Loader2,
  Ruler, Palette, Type, LayoutGrid, AlignJustify, Droplets,
} from 'lucide-react'

const TRIM_SIZES: Record<string, { label: string; width: number; height: number }> = {
  '6x9':      { label: 'Trade 6 × 9 in',       width: 432, height: 648 },
  '5.5x8.5':  { label: 'Digest 5.5 × 8.5 in',  width: 396, height: 612 },
  '5x8':      { label: 'Pocket 5 × 8 in',       width: 360, height: 576 },
  '8.5x11':   { label: 'Letter 8.5 × 11 in',    width: 612, height: 792 },
  '6.14x9.21':{ label: 'A5 6.14 × 9.21 in',     width: 442, height: 663 },
  '7x10':     { label: 'Royal 7 × 10 in',        width: 504, height: 720 },
}

const THEMES: Record<string, { label: string; description: string; headingFont: string; bodyFont: string; dropCap: boolean }> = {
  classic: { label: 'Classic Literary', description: 'Traditional novel layout with generous margins and classic typography', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif', dropCap: true },
  modern:  { label: 'Modern Clean',    description: 'Minimalist design with crisp spacing and modern type hierarchy', headingFont: 'Inter, sans-serif', bodyFont: 'Inter, sans-serif', dropCap: false },
  academic:{ label: 'Academic',        description: 'Structured layout suitable for non-fiction and textbooks', headingFont: 'Georgia, serif', bodyFont: 'Georgia, serif', dropCap: false },
  vintage: { label: 'Vintage Press',   description: 'Warm, old-world typography reminiscent of classic hardcovers', headingFont: 'Georgia, serif', bodyFont: '"Book Antiqua", Palatino, serif', dropCap: true },
}

const MARGINS: Record<string, { label: string; top: number; bottom: number; inner: number; outer: number }> = {
  moderate:  { label: 'Moderate (0.75″)', top: 54, bottom: 54, inner: 54, outer: 54 },
  narrow:    { label: 'Narrow (0.5″)',    top: 36, bottom: 36, inner: 36, outer: 36 },
  wide:      { label: 'Wide (1″)',        top: 72, bottom: 72, inner: 72, outer: 72 },
  verywide:  { label: 'Very Wide (1.25″)',top: 90, bottom: 90, inner: 90, outer: 90 },
}

interface TypesettingOptions {
  trimSize: string
  theme: string
  exportFont: 'serif' | 'sans'
  margins: string
  facingPages: boolean
  pageNumbers: boolean
  dropCaps: boolean
  hyphenation: boolean
  startPageOnChapter1: boolean
  lineSpacing: number
  [key: string]: string | number | boolean
}

interface Props {
  editor: Editor | null
}

export default function TypesetterPanel({ editor }: Props) {
  const { activeManuscript, updateManuscript, typesetterOpen } = useStudioStore()
  const [isExporting, setIsExporting] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('layout')
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  if (!activeManuscript) {
    return (
      <aside className={`typesetter-panel w-72 flex-shrink-0 bg-panel-bg border-l border-panel-border flex items-center justify-center transition-transform duration-300 z-40 md:relative md:translate-x-0 ${typesetterOpen ? 'fixed top-8 bottom-0 right-0 translate-x-0' : 'fixed top-8 bottom-0 right-0 translate-x-full md:translate-x-0'}`}>
        <div className="text-center px-6">
          <BookOpen size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Typesetter</p>
          <p className="text-xs text-gray-400 mt-1">Open a manuscript to configure book formatting</p>
        </div>
      </aside>
    )
  }

  const trimSize = activeManuscript.trim_size ?? '6x9'
  const theme = activeManuscript.theme ?? 'classic'
  const exportFont = activeManuscript.export_font ?? 'serif'
  const trimDims = TRIM_SIZES[trimSize] ?? TRIM_SIZES['6x9']
  const themeConfig = THEMES[theme] ?? THEMES.classic
  const previewScale = 180 / trimDims.width
  const previewHeight = trimDims.height * previewScale

  // Build typesetting options from manuscript settings
  const options: TypesettingOptions = {
    trimSize,
    theme,
    exportFont,
    margins: 'moderate',
    facingPages: true,
    pageNumbers: true,
    dropCaps: themeConfig.dropCap,
    hyphenation: true,
    startPageOnChapter1: true,
    lineSpacing: 1.6,
  }

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  const handleExport = useCallback(async (format: 'pdf' | 'epub') => {
    if (!activeManuscript?.id) return
    setIsExporting(true)
    setExportSuccess(null)
    try {
      const result = await studioApi.export.generate(format, activeManuscript.id, options)
      setExportSuccess(`${format.toUpperCase()} exported successfully!`)
      setTimeout(() => setExportSuccess(null), 3000)
    } catch (err) {
      console.error(`Export ${format} failed:`, err)
      setExportSuccess(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setTimeout(() => setExportSuccess(null), 5000)
    } finally {
      setIsExporting(false)
    }
  }, [activeManuscript?.id, options])

  return (
    <aside className={`typesetter-panel w-72 flex-shrink-0 bg-panel-bg border-l border-panel-border flex flex-col overflow-y-auto transition-transform duration-300 z-40 md:relative md:translate-x-0 ${typesetterOpen ? 'fixed top-8 bottom-0 right-0 translate-x-0' : 'fixed top-8 bottom-0 right-0 translate-x-full md:translate-x-0'}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border flex-shrink-0 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <LayoutGrid size={15} className="text-brand" />
          <span className="text-sm font-bold text-[#1a1f2e]">Typesetter</span>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          Active
        </span>
      </div>

      {/* Live Page Preview */}
      <div className="flex-shrink-0 p-4 border-b border-panel-border bg-gradient-to-b from-[#d4cfc4] to-[#c4bfb4]">
        <p className="text-[10px] text-gray-600 text-center mb-2 font-medium uppercase tracking-wider">Live Preview</p>
        <div className="flex justify-center">
          <div
            className="bg-white shadow-lg relative overflow-hidden transition-all duration-300"
            style={{
              width: 180,
              height: Math.round(previewHeight),
              fontFamily: exportFont === 'serif' ? 'Georgia, serif' : 'Inter, sans-serif',
              fontSize: 6.5,
              lineHeight: options.lineSpacing,
              padding: '14px 12px',
              borderRadius: 1,
            }}
          >
            {/* Decorative ornament */}
            <div className="text-center mb-2" style={{ fontSize: 8, fontWeight: 700, opacity: 0.3 }}>
              ✦
            </div>

            {/* Chapter header */}
            <div className="text-center mb-1" style={{ fontSize: 6, letterSpacing: '0.2em', opacity: 0.4, textTransform: 'uppercase' }}>
              Chapter One
            </div>
            <div className="text-center mb-2 font-bold" style={{ fontSize: 9, lineHeight: 1.2 }}>
              The First Page
            </div>

            {/* Drop cap preview */}
            {options.dropCaps && (
              <div style={{ marginBottom: 3 }}>
                <span style={{
                  float: 'left', fontSize: 24, lineHeight: 0.75,
                  marginRight: 2, marginTop: 2, fontWeight: 700,
                  fontFamily: 'Georgia, serif',
                }}>T</span>
                <span style={{ opacity: 0.25 }}>he morning light filtered</span>
              </div>
            )}

            {/* Content lines */}
            {Array.from({ length: Math.max(6, Math.floor((previewHeight - 80) / 10)) }, (_, i) => (
              <div key={i} style={{
                height: 1.5, marginBottom: 3,
                width: `${60 + Math.sin(i * 1.7) * 25 + (i % 3) * 5}%`,
                background: '#1a1f2e', opacity: 0.1 + (i % 4) * 0.03, borderRadius: 1,
              }} />
            ))}

            {/* Page number */}
            {options.pageNumbers && (
              <div style={{
                position: 'absolute', bottom: 6, left: 0, right: 0,
                textAlign: 'center', fontSize: 5.5, opacity: 0.3, fontFamily: 'Inter, sans-serif',
              }}>
                42
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          {trimDims.label}
        </p>
      </div>

      {/* Controls */}
      <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">

        {/* Page Size & Margins */}
        <CollapsibleSection
          id="layout"
          title="Page Layout"
          icon={<Ruler size={13} />}
          expanded={expandedSection === 'layout'}
          onToggle={toggleSection}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(TRIM_SIZES).map(([key, sz]) => (
              <button
                key={key}
                onClick={() => updateManuscript(activeManuscript.id, { trim_size: key })}
                className={`text-[10px] py-1.5 px-2 rounded-lg border transition-all font-medium text-left ${
                  trimSize === key
                    ? 'bg-brand/15 text-brand border-brand/40 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-150 hover:border-brand/30'
                }`}
              >
                <div className="font-semibold">{key}"</div>
                <div className="opacity-50 text-[9px]">{sz.label.split(' ').slice(0, 1)}</div>
              </button>
            ))}
          </div>

          <label className="block text-[10px] font-semibold text-gray-500 mt-2 mb-1">Margins</label>
          <select
            value={options.margins}
            onChange={e => {/* TODO: store in manuscript settings */}}
            className="w-full text-[11px] px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand/30"
          >
            {Object.entries(MARGINS).map(([key, m]) => (
              <option key={key} value={key}>{m.label}</option>
            ))}
          </select>

          <label className="block text-[10px] font-semibold text-gray-500 mt-2 mb-1">Line Spacing</label>
          <div className="flex items-center gap-2">
            <input
              type="range" min={1.2} max={2.5} step={0.1}
              value={options.lineSpacing}
              onChange={() => {}}
              className="flex-1 accent-brand h-1"
            />
            <span className="text-[10px] font-mono text-gray-500 w-7">{options.lineSpacing}</span>
          </div>
        </CollapsibleSection>

        {/* Interior Style */}
        <CollapsibleSection
          id="theme"
          title="Interior Style"
          icon={<Palette size={13} />}
          expanded={expandedSection === 'theme'}
          onToggle={toggleSection}
        >
          <div className="space-y-1.5">
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => updateManuscript(activeManuscript.id, { theme: key })}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                  theme === key
                    ? 'bg-brand/15 text-brand border-brand/40'
                    : 'bg-white text-gray-600 border-gray-150 hover:border-brand/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold">{t.label}</span>
                  {theme === key && <Check size={12} className="text-brand flex-shrink-0" />}
                </div>
                <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t.description}</p>
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Font Choice */}
        <CollapsibleSection
          id="font"
          title="Export Font"
          icon={<Type size={13} />}
          expanded={expandedSection === 'font'}
          onToggle={toggleSection}
        >
          <p className="text-[9px] text-gray-400 mb-2">Exported files always use basic serif or sans-serif for maximum compatibility.</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => updateManuscript(activeManuscript.id, { export_font: 'serif' })}
              className={`flex-1 py-2.5 text-[11px] font-medium transition-all ${
                exportFont === 'serif'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <span className="block text-center text-lg leading-none mb-0.5">Ag</span>
              Serif
            </button>
            <button
              onClick={() => updateManuscript(activeManuscript.id, { export_font: 'sans' })}
              className={`flex-1 py-2.5 text-[11px] font-medium transition-all ${
                exportFont === 'sans'
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span className="block text-center text-lg leading-none mb-0.5">Ag</span>
              Sans
            </button>
          </div>
        </CollapsibleSection>

        {/* Advanced Options */}
        <CollapsibleSection
          id="advanced"
          title="Advanced Options"
          icon={<AlignJustify size={13} />}
          expanded={expandedSection === 'advanced'}
          onToggle={toggleSection}
        >
          <div className="space-y-2.5">
            {[
              { label: 'Facing pages (mirror margins)', key: 'facingPages', enabled: options.facingPages },
              { label: 'Page numbers starting on Ch. 1', key: 'startPageOnChapter1', enabled: options.startPageOnChapter1 },
              { label: 'Drop caps on chapter start', key: 'dropCaps', enabled: options.dropCaps },
              { label: 'Hyphenation (auto)', key: 'hyphenation', enabled: options.hyphenation },
            ].map(opt => (
              <label key={opt.key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-[11px] text-gray-600 group-hover:text-gray-800 transition-colors">{opt.label}</span>
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked={opt.enabled} />
                  <div className="w-7 h-4 bg-gray-200 rounded-full peer peer-checked:bg-brand
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5
                    after:bg-white after:rounded-full after:h-3 after:w-3
                    after:transition-all peer-checked:after:translate-x-3 transition-colors" />
                </div>
              </label>
            ))}
          </div>
        </CollapsibleSection>

        {/* Export Buttons */}
        <div className="border-t border-gray-200 pt-4 space-y-2">
          {exportSuccess && (
            <div className={`text-[11px] font-medium text-center py-1.5 rounded-lg ${
              exportSuccess.includes('failed') 
                ? 'bg-red-50 text-red-600' 
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {exportSuccess}
            </div>
          )}

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold
              bg-brand hover:bg-brand-dark text-white rounded-lg border border-brand
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export Print PDF
          </button>

          <button
            onClick={() => handleExport('epub')}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold
              bg-white hover:bg-gray-50 text-[#1a1f2e] rounded-lg border border-gray-300
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-brand/30 active:scale-[0.98]"
          >
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FileText size={14} />
            )}
            Export EPUB 3
          </button>

          <p className="text-[9px] text-gray-400 text-center leading-tight px-2">
            PDF exports are print-ready with trim marks. EPUB exports are reflowable and e-reader compatible. Both use {exportFont === 'serif' ? 'Georgia' : 'Inter'} font family.
          </p>
        </div>
      </div>
    </aside>
  )
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  id, title, icon, expanded, onToggle, children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-lg border transition-all ${
      expanded ? 'border-brand/20 bg-white' : 'border-transparent bg-transparent'
    }`}>
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-2.5 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className={`text-[11px] font-semibold transition-colors ${
            expanded ? 'text-brand' : 'text-gray-600'
          }`}>{title}</span>
        </div>
        {expanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-2.5 pb-3 space-y-1.5 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  )
}