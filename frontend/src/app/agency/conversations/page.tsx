import { Topbar } from "@/components/layout/Topbar";
import { getLeads } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default async function ConversationsPage() {
  const leads = await getLeads();
  const activeLead = leads[0];

  return (
    <>
      <Topbar title="Conversations" subtitle={`${leads.length} leads`} />
      <div className="flex-1 overflow-hidden p-5">
        <div className="grid grid-cols-[3fr_1.1fr] gap-3.5 h-full">
          {/* Inbox list */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            <div className="px-3.5 border-b border-border1">
              <div className="flex gap-0">
                {["All", "Qualified", "New", "Nurture"].map((t, i) => (
                  <div key={t} className={cn(
                    "py-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 -mb-px transition-colors",
                    i === 0 ? "text-accent border-accent" : "text-ink-3 border-transparent hover:text-ink"
                  )}>{t}</div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {leads.map((lead, i) => (
                <div key={lead.id} className={cn(
                  "flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border1 last:border-0 cursor-pointer transition-colors",
                  i === 0 && "bg-accent-light/30"
                )}>
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent flex-shrink-0 mt-px">
                    {lead.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-px">
                      <span className="text-xs font-bold">{lead.name}</span>
                      <span className="text-[10px] text-ink-3 font-mono">{timeAgo(lead.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-ink-3 truncate">
                      {lead.formAnswers?.intent ? `${lead.formAnswers.intent} · ${lead.formAnswers.property_type ?? ""}` : lead.email ?? "New lead"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-mono bg-surface2 text-ink-3 px-1 rounded">Score {lead.score}</span>
                      <span className="text-[9px] font-semibold text-ink-3 capitalize">{lead.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            {activeLead ? (
              <>
                <div className="px-4 pt-3.5 pb-3 border-b border-border1">
                  <div className="text-[13px] font-bold">{activeLead.name}</div>
                  <div className="text-[11px] text-ink-3 mt-px">Score {activeLead.score} · {activeLead.status.replace(/_/g, " ")}</div>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-3">
                  {activeLead.summary && (
                    <div className="bg-accent-light/50 border border-accent/15 rounded px-3 py-2 text-xs leading-relaxed">
                      <div className="text-[9.5px] text-accent font-bold mb-1">AI Summary</div>
                      {activeLead.summary}
                    </div>
                  )}
                  {activeLead.formAnswers && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-ink-3 uppercase tracking-wider">Qualification Answers</div>
                      {Object.entries(activeLead.formAnswers).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[11px]">
                          <span className="text-ink-3 capitalize">{k.replace(/_/g, " ")}</span>
                          <span className="font-medium text-right max-w-[60%]">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeLead.phone && (
                    <div className="text-[11px] text-ink-3">
                      Phone: <span className="font-mono text-ink-2">{activeLead.phone}</span>
                    </div>
                  )}
                  {activeLead.email && (
                    <div className="text-[11px] text-ink-3">
                      Email: <span className="text-ink-2">{activeLead.email}</span>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-border1">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a reply…" className="flex-1 px-3 py-2 border border-border1 rounded text-xs outline-none focus:border-accent bg-surface" />
                    <button className="px-4 py-2 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover">Send</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-ink-3">Select a lead</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
