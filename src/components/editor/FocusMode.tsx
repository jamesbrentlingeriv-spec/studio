import { useState, useEffect, useRef, useCallback } from 'react'
import { Moon, Sun, Type, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react'
import { useStudioStore } from '@/store/useStudioStore'

interface FocusModeProps {
  enabled: boolean
  onToggle: () => void
}

export default function FocusMode({ enabled, onToggle }: FocusModeProps) {
  const { settings, setSetting } = useStudioStore()
  const [darkMode, setDarkMode] = useState(false)
  const [typewriterMode, setTypewriterMode] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showHUD, setShowHUD] = useState(true)
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseMove = useCallback(() => {
    setShowHUD(true)
    if (hudTimer.current) clearTimeout(hudTimer.current)
    hudTimer.current = setTimeout(() => {
      if (enabled) setShowHUD(false)
    }, 2000)
  }, [enabled])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      await document.exitFullscreen()
      setFullscreen(false)
    }
  }, [])

  // Manage focus mode class on body
  useEffect(() => {
    if (enabled) {
      document.body.classList.add('focus-mode')
      if (darkMode) {
        document.body.classList.add('dark')
        document.body.classList.add('focus-mode-dark')
      }
      if (typewriterMode) {
        document.body.classList.add('typewriter-mode')
      }
    } else {
      document.body.classList.remove('focus-mode', 'focus-mode-dark', 'typewriter-mode')
      if (!darkMode) document.body.classList.remove('dark')
    }
    return () => {
      document.body.classList.remove('focus-mode', 'focus-mode-dark', 'typewriter-mode')
    }
  }, [enabled, darkMode, typewriterMode])

  // Handle ESC to exit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && enabled) {
        onToggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, onToggle])

  if (!enabled) return null

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowHUD(true)}
    >
      {/* Focus HUD — transparent floating toolbar */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto transition-all duration-500 ${
          showHUD ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/10 shadow-2xl">
          {/* Word count */}
          <span className="text-xs text-white/50 font-mono px-2 tabular-nums">
            <FocusWordCount />
          </span>

          <div className="w-px h-4 bg-white/10" />

          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-full transition-all ${
              darkMode ? 'text-amber-400 bg-white/15' : 'text-white/60 hover:text-white/90 hover:bg-white/10'
            }`}
            title={darkMode ? 'Switch to light' : 'Switch to dark'}
          >
            {darkMode ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Typewriter toggle */}
          <button
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`p-1.5 rounded-full transition-all ${
              typewriterMode ? 'text-brand bg-white/15' : 'text-white/60 hover:text-white/90 hover:bg-white/10'
            }`}
            title={typewriterMode ? 'Typewriter scrolling on' : 'Typewriter scrolling off'}
          >
            <Type size={14} />
          </button>

          <div className="w-px h-4 bg-white/10" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full text-white/60 hover:text-white/90 hover:bg-white/10 transition-all"
            title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Exit focus mode */}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-full text-white/60 hover:text-red-400 hover:bg-white/10 transition-all"
            title="Exit Focus Mode (Esc)"
          >
            <EyeOff size={14} />
          </button>
        </div>
      </div>

      {/* Bottom hint */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 ${
          showHUD ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-xs text-white/20 font-medium tracking-wide">
          Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/30 text-[10px]">Esc</kbd> to exit Focus Mode
        </p>
      </div>
    </div>
  )
}

// ─── Live Word Count Sub-component ────────────────────────────────────────────

function FocusWordCount() {
  const { sections, activeSectionId } = useStudioStore()
  const section = sections.find(s => s.id === activeSectionId)
  const words = section?.word_count ?? 0
  return <>{words.toLocaleString()} words</>
}