"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore errors — redirect anyway
    }
    router.push("/login");
  }

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
          placeholder="Search contacts, leads..."
          className="bg-transparent border-none outline-none text-xs text-ink flex-1 placeholder:text-ink-3"
        />
        <span className="text-[9px] text-ink-3 font-mono border border-border2 rounded px-1">⌘K</span>
      </div>

      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-surface text-ink-2 border border-border1 hover:bg-surface2 hover:text-ink transition-colors">
        + New Contact
      </button>

      {/* Notifications */}
      <div className="w-8 h-8 rounded-md flex items-center justify-center cursor-pointer text-ink-2 bg-surface2 border border-border1 relative text-sm">
        <span>◷</span>
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red border-2 border-surface" />
      </div>

      {/* Profile avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:ring-2 hover:ring-accent/30 transition-all"
        >
          U
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            {/* Menu */}
            <div className="absolute right-0 top-10 z-50 w-48 bg-surface border border-border1 rounded-lg shadow-md py-1">
              <div className="px-3 py-2 border-b border-border1">
                <div className="text-xs font-semibold">Account</div>
                <div className="text-[10px] text-ink-3 mt-0.5">Manage your settings</div>
              </div>
              <button
                onClick={() => { setShowMenu(false); router.push("/agency/dashboard"); }}
                className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:bg-surface2 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => { setShowMenu(false); router.push("/onboarding"); }}
                className="w-full text-left px-3 py-2 text-xs text-ink-2 hover:bg-surface2 transition-colors"
              >
                Edit qualification questions
              </button>
              <div className="border-t border-border1 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full text-left px-3 py-2 text-xs text-red hover:bg-red-light transition-colors"
                >
                  {loggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
