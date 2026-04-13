export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-topbar px-5 border-b border-border1 flex items-center gap-2.5 bg-surface flex-shrink-0">
      <div>
        <div className="text-[15px] font-bold tracking-tight">{title}</div>
        {subtitle && <div className="text-[11px] text-ink-3 mt-px">{subtitle}</div>}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="flex items-center gap-2 bg-surface2 border border-border1 rounded px-3 py-1.5 w-52">
        <span className="text-ink-3 text-[13px]">⌕</span>
        <input
          type="text"
          placeholder="Search contacts, leads…"
          className="bg-transparent border-none outline-none text-xs text-ink flex-1 placeholder:text-ink-3"
        />
        <span className="text-[9px] text-ink-3 font-mono border border-border2 rounded px-1">⌘K</span>
      </div>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-surface text-ink-2 border border-border1 hover:bg-surface2 hover:text-ink transition-colors">
        + New Contact
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-accent text-white border border-accent hover:bg-accent-hover transition-colors">
        ▶ Quick Dial
      </button>

      <div className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer text-ink-2 bg-surface2 border border-border1 relative text-sm">
        <span>◷</span>
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red border-2 border-surface" />
      </div>

      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-white cursor-pointer">
        RJ
      </div>
    </div>
  );
}
