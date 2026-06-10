import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'

interface SplashScreenProps {
  onFinished: () => void
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 25
      })
    }, 200)

    // Fade out after ~2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    // Navigate after fade completes
    const doneTimer = setTimeout(() => {
      onFinished()
    }, 3200)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onFinished])

  // Clamp progress to 100
  const displayProgress = Math.min(Math.round(progress), 100)

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1a1f2e] transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Logo: N.S. branding */}
      <div className="flex flex-col items-center gap-6 animate-slide-up">
        {/* Logo SVG */}
        <div className="w-28 h-28 flex items-center justify-center">
          <img
            src="/ns.svg"
            alt="N.S. Studio"
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>
            Novel Writing Studio
          </h1>
          <p className="text-sm text-gray-400 mt-1.5 font-light tracking-wide">
            Craft your story, one chapter at a time
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-48 mt-4">
          <div className="h-1 bg-[#2d3650] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 text-center mt-2 font-mono">
            {displayProgress < 100 ? 'Loading…' : 'Ready'}
          </p>
        </div>
      </div>

      {/* Subtle footer */}
      <div className="absolute bottom-8 text-center">
        <p className="text-[10px] text-gray-600 tracking-widest uppercase">
          N.S. Studio
        </p>
      </div>
    </div>
  )
}