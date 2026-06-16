import { useAuth } from '@/contexts/AuthContext'
import { useStudioStore } from '@/store/useStudioStore'
import { Menu } from 'lucide-react'

export default function TitleBar() {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useStudioStore()

  return (
    <div className="flex items-center justify-between h-8 bg-sidebar-bg border-b border-sidebar-border flex-shrink-0 px-3 z-50">
      {/* App branding */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-sidebar-text hover:text-white mr-1"
          title="Toggle Sidebar"
        >
          <Menu size={16} />
        </button>
        <img src="/ns.svg" alt="N.S." className="w-4 h-4 object-contain" />
        <span className="text-white font-bold text-sm tracking-tight">✦ Novel Studio</span>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-2">
        {user && (
          <>
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName ?? ''}
                className="w-5 h-5 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-[10px] text-sidebar-text hidden sm:inline max-w-[120px] truncate">
              {user.displayName ?? user.email}
            </span>
            <button
              onClick={logout}
              className="text-[10px] text-sidebar-text opacity-40 hover:opacity-80 hover:text-red-400 transition-colors ml-1 hidden sm:inline"
            >
              Sign out
            </button>
          </>
        )}
        <span className="text-[10px] text-sidebar-text opacity-50">
          N.S. Studio PWA
        </span>
      </div>
    </div>
  )
}
