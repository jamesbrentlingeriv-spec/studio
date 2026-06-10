export default function TitleBar() {
  return (
    <div className="flex items-center justify-between h-8 bg-sidebar-bg border-b border-sidebar-border flex-shrink-0 px-3 z-50">
      {/* App branding */}
      <div className="flex items-center gap-2">
        <img src="/ns.svg" alt="N.S." className="w-4 h-4 brightness-0 invert" />
        <span className="text-brand font-bold text-sm tracking-tight">✦ Novel Studio</span>
      </div>

      {/* PWA install hint */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-sidebar-text opacity-50 hidden sm:inline">
          N.S. Studio PWA
        </span>
      </div>
    </div>
  )
}
