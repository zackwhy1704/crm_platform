"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/pipeline/KanbanBoard";
import { ContactTable } from "@/components/contacts/ContactTable";
import type { Lead, MetricCardData } from "@/lib/types";

const STATUS_TO_STAGE: Record<string, string> = {
  new: "new", qualifying: "new",
  qualified_hot: "qualified", qualified_warm: "qualified",
  assigned: "proposal", contacted: "proposal",
  in_progress: "negotiation",
  won: "won",
};

const STAGE_TO_STATUS: Record<string, string> = {
  new: "new", qualified: "qualified_warm", proposal: "assigned", negotiation: "in_progress", won: "won",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("leads")
        .select(`id, status, ai_score, ai_summary, source_platform, created_at, lead_contacts(name, wa_phone, email), lead_form_answers(answers)`)
        .order("created_at", { ascending: false });
      if (data) {
        setLeads(data.map((l: any) => ({
          id: l.id, name: l.lead_contacts?.name ?? "Unknown", email: l.lead_contacts?.email, phone: l.lead_contacts?.wa_phone,
          status: l.status, score: l.ai_score ?? 0, source: l.source_platform, summary: l.ai_summary,
          formAnswers: l.lead_form_answers?.answers, createdAt: l.created_at,
        })));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const total = leads.length;
  const qualified = leads.filter((l) => ["qualified_hot", "qualified_warm", "assigned", "contacted", "in_progress", "won"].includes(l.status)).length;
  const scored = leads.filter((l) => l.score > 0).length;
  const won = leads.filter((l) => l.status === "won").length;
  const newWeek = leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 86400000).length;

  const metricCards: MetricCardData[] = [
    { label: "Total Leads", value: total.toString(), delta: `${newWeek} this week`, deltaDirection: newWeek > 0 ? "up" : undefined, color: "blue" },
    { label: "Qualified", value: qualified.toString(), delta: `${total > 0 ? Math.round((qualified / total) * 100) : 0}% rate`, color: "green" },
    { label: "Scored by AI", value: scored.toString(), color: "amber" },
    { label: "Won Deals", value: won.toString(), color: "purple" },
  ];

  const kanbanCards: KanbanCard[] = leads.filter((l) => STATUS_TO_STAGE[l.status]).map((l) => ({
    id: l.id, stage: STATUS_TO_STAGE[l.status],
    name: l.name, subtitle: l.formAnswers?.intent ? `${l.formAnswers.intent} · ${l.formAnswers.property_type ?? ""}` : (l.email ?? ""),
    value: l.formAnswers?.budget ?? "Pending", initials: l.name.split(" ").map((p) => p[0]).join("").slice(0, 2),
    age: timeAgo(l.createdAt), score: l.score, won: l.status === "won",
  }));

  const columns: KanbanColumn[] = [
    { stage: "new", label: "New", count: kanbanCards.filter((c) => c.stage === "new").length },
    { stage: "qualified", label: "Qualified", count: kanbanCards.filter((c) => c.stage === "qualified").length },
    { stage: "proposal", label: "Viewing", count: kanbanCards.filter((c) => c.stage === "proposal").length },
    { stage: "negotiation", label: "In Progress", count: kanbanCards.filter((c) => c.stage === "negotiation").length },
    { stage: "won", label: "Closed", count: kanbanCards.filter((c) => c.stage === "won").length },
  ];

  async function handleMoveCard(cardId: string, newStage: string) {
    const newStatus = STAGE_TO_STATUS[newStage];
    if (!newStatus) return;
    setLeads((prev) => prev.map((l) => (l.id === cardId ? { ...l, status: newStatus as any } : l)));
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("leads").update({ status: newStatus, ...(newStatus === "won" ? { won_at: new Date().toISOString() } : {}) }).eq("id", cardId);
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle={`${total} leads · ${qualified} qualified`} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {metricCards.map((m) => (<MetricCard key={m.label} data={m} />))}
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold">Deal Pipeline</div>
              <div className="text-[11px] text-ink-3 mt-px">{leads.length} leads · drag to update</div>
            </div>
            <a href="/agency/pipeline" className="text-[11px] font-semibold text-accent hover:underline">Full view →</a>
          </div>
          {loading ? (
            <div className="p-8 text-center text-xs text-ink-3">Loading...</div>
          ) : (
            <KanbanBoard columns={columns} cards={kanbanCards} onMoveCard={handleMoveCard} />
          )}
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div className="text-[13px] font-bold">Recent Leads</div>
            <a href="/agency/contacts" className="text-[11px] font-semibold text-accent hover:underline">All contacts →</a>
          </div>
          <ContactTable leads={leads.slice(0, 10)} />
        </div>
      </div>
    </>
  );
}
