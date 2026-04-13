import { Topbar } from "@/components/layout/Topbar";
import { mockMessages, mockLeads } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function ConversationsPage() {
  const activeLead = mockLeads[0];
  const messages = mockMessages[activeLead.id] ?? [];

  return (
    <>
      <Topbar title="Conversations" subtitle="7 unread across WhatsApp" />
      <div className="flex-1 overflow-hidden p-5">
        <div className="grid grid-cols-[3fr_1.1fr] gap-3.5 h-full">
          {/* Inbox list */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            <div className="px-3.5 border-b border-border1">
              <div className="flex gap-0">
                {["All 7", "WhatsApp", "Missed", "Closed"].map((t, i) => (
                  <div
                    key={t}
                    className={cn(
                      "py-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 -mb-px transition-colors flex items-center gap-1",
                      i === 0 ? "text-accent border-accent" : "text-ink-3 border-transparent hover:text-ink"
                    )}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockLeads.map((lead, i) => (
                <div
                  key={lead.id}
                  className={cn(
                    "flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border1 last:border-0 cursor-pointer transition-colors",
                    i === 0 && "bg-amber-light/30"
                  )}
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0 mt-px bg-green-light">
                    💬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-px">
                      <span className="text-xs font-bold">{lead.name}</span>
                      <span className="text-[10px] text-ink-3 font-mono">
                        {i === 0 ? "2m" : `${i}h`}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-3 truncate">
                      {lead.company ?? lead.email ?? "New lead"}
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="w-[7px] h-[7px] rounded-full bg-accent flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Thread */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            <div className="px-4 pt-3.5 pb-3 border-b border-border1">
              <div className="text-[13px] font-bold">{activeLead.name} · WhatsApp</div>
              <div className="text-[11px] text-ink-3 mt-px">
                Score {activeLead.score} · {activeLead.company ?? ""}
              </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[75%] rounded-lg px-3 py-2 text-xs leading-relaxed border",
                      m.direction === "outbound"
                        ? "bg-accent-light border-accent/15 rounded-tr-none"
                        : "bg-surface2 border-border1 rounded-tl-none"
                    )}
                  >
                    {m.senderType === "ai" && (
                      <div className="text-[9.5px] text-accent font-bold mb-1">⦿ Ava AI</div>
                    )}
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a reply…"
                  className="flex-1 px-3 py-2 border border-border1 rounded text-xs outline-none focus:border-accent bg-surface"
                />
                <button className="px-4 py-2 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
