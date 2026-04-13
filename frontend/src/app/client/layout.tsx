"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  async function handleLogout() {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <aside className="w-52 bg-surface border-r border-border1 flex flex-col flex-shrink-0">
        <div className="px-4 pt-4 pb-3.5 border-b border-border1 flex items-center gap-2">
          <div className="w-7 h-7 bg-green rounded-lg flex items-center justify-center text-[13px] font-bold text-white">
            C
          </div>
          <div className="text-[15px] font-bold tracking-tight">Client Portal</div>
        </div>
        <nav className="flex-1 py-2.5 px-2">
          <Link
            href="/client/leads"
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded text-[12.5px] font-medium",
              pathname === "/client/leads" ? "bg-accent-light text-accent" : "text-ink-2 hover:bg-surface2"
            )}
          >
            <span>◉</span> My Leads
          </Link>
          <Link
            href="/client/dashboard"
            className={cn(
              "flex items-center gap-2.5 px-2 py-1.5 rounded text-[12.5px] font-medium mt-px",
              pathname === "/client/dashboard" ? "bg-accent-light text-accent" : "text-ink-2 hover:bg-surface2"
            )}
          >
            <span>▲</span> Dashboard
          </Link>
        </nav>

        {/* Account */}
        <div className="relative m-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-full p-2.5 bg-surface2 rounded border border-border1 flex items-center gap-2.5 cursor-pointer hover:border-accent/50 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-green flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              U
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">My Account</div>
              <div className="text-[10px] text-ink-3">Client</div>
            </div>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-surface border border-border1 rounded-lg shadow-md py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-xs text-red hover:bg-red-light transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">{children}</main>
    </div>
  );
}
