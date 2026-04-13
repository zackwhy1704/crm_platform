import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { ContactTable } from "@/components/contacts/ContactTable";
import { getLeads, getMetrics } from "@/lib/supabase/queries";
import type { MetricCardData } from "@/lib/types";

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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default async function DashboardPage() {
  const [leads, metrics] = await Promise.all([getLeads(), getMetrics()]);

  const metricCards: MetricCardData[] = [
    { label: "Total Leads", value: metrics.totalLeads.toString(), delta: `${metrics.newThisWeek} this week`, deltaDirection: metrics.newThisWeek > 0 ? "up" : undefined, color: "blue" },
    { label: "Qualified", value: metrics.qualifiedLeads.toString(), delta: `${metrics.totalLeads > 0 ? Math.round((metrics.qualifiedLeads / metrics.totalLeads) * 100) : 0}% rate`, color: "green" },
    { label: "Scored by AI", value: leads.filter((l) => l.score > 0).length.toString(), color: "amber" },
    { label: "Won Deals", value: metrics.wonDeals.toString(), color: "purple" },
  ];

  const kanbanCards = leads
    .filter((l) => stageMap[l.status])
    .map((l) => ({
      stage: stageMap[l.status],
      name: l.name,
      subtitle: l.formAnswers?.intent ? `${l.formAnswers.intent} · ${l.formAnswers.property_type ?? ""}` : (l.company ?? l.email ?? ""),
      value: l.formAnswers?.budget ?? "Pending",
      initials: l.name.split(" ").map((p) => p[0]).join("").slice(0, 2),
      age: timeAgo(l.createdAt),
      won: l.status === "won",
    }));

  const columns = [
    { stage: "new", label: "New", count: kanbanCards.filter((c) => c.stage === "new").length, value: 0 },
    { stage: "qualified", label: "Qualified", count: kanbanCards.filter((c) => c.stage === "qualified").length, value: 0 },
    { stage: "proposal", label: "Viewing", count: kanbanCards.filter((c) => c.stage === "proposal").length, value: 0 },
    { stage: "negotiation", label: "In Progress", count: kanbanCards.filter((c) => c.stage === "negotiation").length, value: 0 },
    { stage: "won", label: "Closed", count: kanbanCards.filter((c) => c.stage === "won").length, value: 0 },
  ];

  return (
    <>
      <Topbar title="Dashboard" subtitle={`${metrics.totalLeads} leads · ${metrics.qualifiedLeads} qualified`} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {metricCards.map((m) => (
            <MetricCard key={m.label} data={m} />
          ))}
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold">Deal Pipeline</div>
              <div className="text-[11px] text-ink-3 mt-px">{leads.length} leads in pipeline</div>
            </div>
            <a href="/agency/pipeline" className="text-[11px] font-semibold text-accent cursor-pointer hover:underline">Full view →</a>
          </div>
          <KanbanBoard columns={columns} cards={kanbanCards} />
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div className="text-[13px] font-bold">Recent Leads</div>
            <a href="/agency/contacts" className="text-[11px] font-semibold text-accent cursor-pointer hover:underline">All contacts →</a>
          </div>
          <ContactTable leads={leads.slice(0, 10)} />
        </div>
      </div>
    </>
  );
}
