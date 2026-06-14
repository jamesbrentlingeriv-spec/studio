import { BookOpen, Library, Bot, Settings, ChevronRight, StickyNote } from 'lucide-react'
import { useStudioStore, type AppView } from '@/store/useStudioStore'

type NavItem = {
  id: AppView
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'shelf',     label: 'My Shelf',     icon: <Library size={18} /> },
  { id: 'editor',    label: 'Write',        icon: <BookOpen size={18} /> },
  { id: 'corkboard', label: 'Corkboard',    icon: <StickyNote size={18} /> },
  { id: 'ai',        label: 'AI Assistant', icon: <Bot size={18} /> },
  { id: 'settings',  label: 'Settings',     icon: <Settings size={18} /> },
]

export default function AppSidebar() {
  const {
    currentView,
    setView,
    manuscripts,
    activeManuscript,
    setActiveManuscript,
    setChatOpen,
    isChatOpen,
  } = useStudioStore()

  function handleNav(view: AppView) {
    if (view === 'ai') {
      setChatOpen(!isChatOpen)
      return
    }
    if (view === 'corkboard') {
      setView('corkboard')
      return
    }
    setView(view)
  }

  const recentDocs = manuscripts.slice(0, 5)

  return (
    <aside className="sidebar w-60 flex-shrink-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col h-full">
      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => handleNav(item.id)}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 text-left
              ${(currentView === item.id || (item.id === 'ai' && isChatOpen))
                ? 'bg-sidebar-active text-sidebar-text-active'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              }
            `}
          >
            <span className={currentView === item.id ? 'text-white' : 'text-sidebar-text'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Recent Documents */}
      <div className="border-t border-sidebar-border px-2 py-3">
        <p className="text-xs font-semibold text-sidebar-text uppercase tracking-widest px-3 mb-2">
          Recent
        </p>
        <div className="space-y-0.5">
          {recentDocs.length === 0 && (
            <p className="text-xs text-sidebar-text px-3 opacity-50">No documents yet</p>
          )}
          {recentDocs.map(ms => (
            <button
              key={ms.id}
              onClick={() => {
                setActiveManuscript(ms)
                setView('editor')
              }}
              className={`
                w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg
                text-xs transition-all duration-150 text-left group
                ${activeManuscript?.id === ms.id
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }
              `}
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{ms.title}</p>
                <p className="opacity-50 text-[10px]">
                  {ms.word_count?.toLocaleString() ?? 0} words
                </p>
              </div>
              <ChevronRight size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-50" />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
