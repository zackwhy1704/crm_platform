"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: { count: number; color: "red" | "green" | "amber" };
};

type NavSection = { title: string; items: NavItem[] };

const agencyNav: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/agency/dashboard", icon: "▦" },
      { label: "Conversations", href: "/agency/conversations", icon: "✉", badge: { count: 7, color: "red" } },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Pipeline", href: "/agency/pipeline", icon: "◈" },
      { label: "Contacts", href: "/agency/contacts", icon: "◐", badge: { count: 12, color: "green" } },
    ],
  },
  {
    title: "AI Qualification",
    items: [
      { label: "AI Calls", href: "/agency/calls", icon: "☎", badge: { count: 1, color: "red" } },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campaigns", href: "/agency/campaigns", icon: "◆" },
      { label: "Sequences", href: "/agency/sequences", icon: "→" },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Smart Flows", href: "/agency/automation", icon: "⚡" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", href: "/agency/analytics", icon: "▲" },
    ],
  },
];

const badgeClass = {
  red: "bg-red text-white",
  green: "bg-green text-white",
  amber: "bg-amber text-white",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-sidebar bg-surface border-r border-border1 flex flex-col flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-4 pt-4 pb-3.5 border-b border-border1 flex items-center gap-2">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-[13px] font-bold text-white tracking-tight">
          C
        </div>
        <div className="text-[15px] font-bold tracking-tight">
          CRM<span className="text-accent">Platform</span>
        </div>
        <span className="ml-auto text-[9px] font-semibold bg-accent-light text-accent px-1.5 py-0.5 rounded-full tracking-wider">
          SG
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2.5 px-2 overflow-y-auto">
        {agencyNav.map((section) => (
          <div key={section.title}>
            <div className="text-[10px] font-semibold text-ink-3 tracking-wider uppercase px-2 pt-2.5 pb-1">
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded transition-colors text-[12.5px] font-medium mb-[1px]",
                    active
                      ? "bg-accent-light text-accent"
                      : "text-ink-2 hover:bg-surface2 hover:text-ink"
                  )}
                >
                  <span className="w-[15px] text-center text-[13px] flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-semibold min-w-[18px] text-center px-1.5 rounded-full h-4 leading-4",
                        badgeClass[item.badge.color]
                      )}
                    >
                      {item.badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Workspace card */}
      <div className="m-2 p-2.5 bg-surface2 rounded border border-border1 flex items-center gap-2.5 cursor-pointer">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
          KR
        </div>
        <div>
          <div className="text-xs font-semibold">Koi Reno SG</div>
          <div className="text-[10px] text-ink-3">Pro Plan · 5 seats</div>
        </div>
      </div>
    </aside>
  );
}
