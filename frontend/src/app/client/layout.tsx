import Link from "next/link";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Minimal client sidebar */}
      <aside className="w-52 bg-surface border-r border-border1 flex flex-col flex-shrink-0">
        <div className="px-4 pt-4 pb-3.5 border-b border-border1 flex items-center gap-2">
          <div className="w-7 h-7 bg-green rounded-lg flex items-center justify-center text-[13px] font-bold text-white">
            D
          </div>
          <div className="text-[15px] font-bold tracking-tight">Demo Reno Co</div>
        </div>
        <nav className="flex-1 py-2.5 px-2">
          <Link
            href="/client/leads"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-accent-light text-accent text-[12.5px] font-medium"
          >
            <span>◉</span> My Leads
          </Link>
          <Link
            href="/client/dashboard"
            className="flex items-center gap-2.5 px-2 py-1.5 rounded text-ink-2 hover:bg-surface2 text-[12.5px] font-medium mt-px"
          >
            <span>▲</span> Dashboard
          </Link>
        </nav>
        <div className="p-3 border-t border-border1 text-[10px] text-ink-3">
          Client Portal · Read-only
          <br />
          Powered by CRM Platform
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
    </div>
  );
}
