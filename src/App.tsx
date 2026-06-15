import { useEffect } from 'react'
import { useStudioStore } from '@/store/useStudioStore'
import { useAuth } from '@/contexts/AuthContext'
import AppSidebar from '@/components/sidebar/AppSidebar'
import BookShelf from '@/components/shelf/BookShelf'
import StudioEditor from '@/components/editor/StudioEditor'
import Corkboard from '@/components/corkboard/Corkboard'
import AIChatOverlay from '@/components/ai/AIChatOverlay'
import SettingsPanel from '@/components/settings/SettingsPanel'
import TitleBar from '@/components/TitleBar'

export default function App() {
  const {
    currentView,
    activeManuscript,
    fetchManuscripts,
    fetchSeries,
    fetchFonts,
    fetchSettings,
    isChatOpen,
    sidebarOpen,
    setSidebarOpen,
  } = useStudioStore()

  const { user, logout } = useAuth()

  // Load everything on mount
  useEffect(() => {
    fetchManuscripts()
    fetchSeries()
    fetchFonts()
    fetchSettings()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-sidebar-bg text-white overflow-hidden">
      {/* Custom Title Bar */}
      <TitleBar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <AppSidebar />

        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-30 top-8"
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {currentView === 'shelf' && <BookShelf />}
          {currentView === 'corkboard' && <Corkboard />}
          {currentView === 'editor' && activeManuscript && <StudioEditor />}
          {currentView === 'editor' && !activeManuscript && (
            <div className="flex items-center justify-center h-full text-sidebar-text">
              <div className="text-center">
                <div className="text-6xl mb-4">📖</div>
                <p className="text-lg font-medium">No manuscript selected</p>
                <p className="text-sm opacity-60 mt-1">Choose a book from the Shelf to start writing</p>
              </div>
            </div>
          )}
          {currentView === 'settings' && <SettingsPanel />}
        </main>
      </div>

      {/* AI Chat Overlay — always available */}
      {isChatOpen && <AIChatOverlay />}
    </div>
  )
}
