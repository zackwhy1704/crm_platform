import { Topbar } from "@/components/layout/Topbar";
import { getLeads } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const stageColor: Record<string, string> = {
  qualified_hot: "bg-red-light text-red",
  qualified_warm: "bg-amber-light text-amber",
  contacted: "bg-accent-light text-accent",
  assigned: "bg-green-light text-green",
  in_progress: "bg-purple-light text-purple",
  won: "bg-green-light text-green",
};

export default async function ClientLeadsPage() {
  const allLeads = await getLeads();
  // Client would only see assigned leads via RLS. For now, filter manually.
  const leads = allLeads.filter((l) =>
    ["qualified_hot", "qualified_warm", "assigned", "contacted", "in_progress", "won"].includes(l.status),
  );

  return (
    <>
      <Topbar title="My Leads" subtitle={`${leads.length} qualified leads`} />
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {leads.length === 0 && (
          <div className="bg-surface border border-border1 rounded-lg shadow-sm p-10 text-center text-xs text-ink-3">
            No leads assigned yet. They will appear here once AI qualification is complete.
          </div>
        )}
        {leads.map((lead) => (
          <div key={lead.id} className="bg-surface border border-border1 rounded-lg shadow-sm p-4 hover:border-accent transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {lead.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold">{lead.name}</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", stageColor[lead.status] ?? "bg-surface2 text-ink-3")}>
                    {lead.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-ink-3 ml-auto">Score {lead.score}</span>
                </div>
                {lead.summary && (
                  <div className="text-xs text-ink-2 mt-2 bg-surface2 rounded px-2 py-1.5 leading-relaxed">
                    <span className="text-accent font-semibold">AI Summary:</span> {lead.summary}
                  </div>
                )}
                {lead.formAnswers && Object.keys(lead.formAnswers).length > 0 && (
                  <div className="flex items-center gap-3 mt-2 text-[11px] flex-wrap">
                    {Object.entries(lead.formAnswers).map(([key, val]) => (
                      <span key={key}>
                        <span className="text-ink-3 capitalize">{key.replace(/_/g, " ")}:</span>{" "}
                        <span className="font-semibold">{val}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 py-1.5 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors">
                    Open Conversation
                  </button>
                  <button className="px-3 py-1.5 rounded text-xs font-semibold bg-surface text-ink-2 border border-border1 hover:bg-surface2">
                    Mark Contacted
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
