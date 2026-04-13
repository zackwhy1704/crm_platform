import { Topbar } from "@/components/layout/Topbar";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { getLeads } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

const stageMap: Record<string, string> = {
  new: "new", qualifying: "new",
  qualified_hot: "qualified", qualified_warm: "qualified",
  assigned: "proposal", contacted: "proposal",
  in_progress: "negotiation",
  won: "won",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default async function PipelinePage() {
  const leads = await getLeads();

  const cards = leads
    .filter((l) => stageMap[l.status])
    .map((l) => ({
      stage: stageMap[l.status],
      name: l.name,
      subtitle: l.formAnswers?.intent
        ? `${l.formAnswers.intent} · ${l.formAnswers.property_type ?? ""}`
        : (l.email ?? ""),
      value: l.formAnswers?.budget ?? "—",
      initials: l.name.split(" ").map((p) => p[0]).join("").slice(0, 2),
      age: timeAgo(l.createdAt),
      won: l.status === "won",
    }));

  const columns = [
    { stage: "new", label: "New", count: cards.filter((c) => c.stage === "new").length, value: 0 },
    { stage: "qualified", label: "Qualified", count: cards.filter((c) => c.stage === "qualified").length, value: 0 },
    { stage: "proposal", label: "Viewing", count: cards.filter((c) => c.stage === "proposal").length, value: 0 },
    { stage: "negotiation", label: "In Progress", count: cards.filter((c) => c.stage === "negotiation").length, value: 0 },
    { stage: "won", label: "Closed", count: cards.filter((c) => c.stage === "won").length, value: 0 },
  ];

  return (
    <>
      <Topbar title="Deal Pipeline" subtitle={`${leads.length} leads total`} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1">
            <div className="text-[13px] font-bold">All Deals — Kanban</div>
          </div>
          <KanbanBoard columns={columns} cards={cards} />
        </div>
      </div>
    </>
  );
}
