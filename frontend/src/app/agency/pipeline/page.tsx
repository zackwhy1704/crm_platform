"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { KanbanBoard, type KanbanCard, type KanbanColumn } from "@/components/pipeline/KanbanBoard";
import type { Lead } from "@/lib/types";

// Map lead statuses to kanban stages
const STATUS_TO_STAGE: Record<string, string> = {
  new: "new", qualifying: "new",
  qualified_hot: "qualified", qualified_warm: "qualified",
  assigned: "proposal", contacted: "proposal",
  in_progress: "negotiation",
  won: "won",
};

// Map kanban stages back to lead statuses for DB update
const STAGE_TO_STATUS: Record<string, string> = {
  new: "new",
  qualified: "qualified_warm",
  proposal: "assigned",
  negotiation: "in_progress",
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

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("leads")
        .select(`
          id, status, ai_score, source_platform, created_at,
          lead_contacts ( name, wa_phone, email ),
          lead_form_answers ( answers )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setLeads(data.map((l: any) => ({
          id: l.id,
          name: l.lead_contacts?.name ?? "Unknown",
          email: l.lead_contacts?.email ?? undefined,
          phone: l.lead_contacts?.wa_phone ?? undefined,
          status: l.status,
          score: l.ai_score ?? 0,
          source: l.source_platform,
          formAnswers: l.lead_form_answers?.answers ?? undefined,
          createdAt: l.created_at,
        })));
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  const cards: KanbanCard[] = leads
    .filter((l) => STATUS_TO_STAGE[l.status])
    .map((l) => ({
      id: l.id,
      stage: STATUS_TO_STAGE[l.status],
      name: l.name,
      subtitle: l.formAnswers?.intent
        ? `${l.formAnswers.intent} · ${l.formAnswers.property_type ?? ""}`
        : (l.email ?? ""),
      value: l.formAnswers?.budget ?? "—",
      initials: l.name.split(" ").map((p) => p[0]).join("").slice(0, 2),
      age: timeAgo(l.createdAt),
      score: l.score,
      won: l.status === "won",
    }));

  const columns: KanbanColumn[] = [
    { stage: "new", label: "New", count: cards.filter((c) => c.stage === "new").length },
    { stage: "qualified", label: "Qualified", count: cards.filter((c) => c.stage === "qualified").length },
    { stage: "proposal", label: "Viewing", count: cards.filter((c) => c.stage === "proposal").length },
    { stage: "negotiation", label: "In Progress", count: cards.filter((c) => c.stage === "negotiation").length },
    { stage: "won", label: "Closed", count: cards.filter((c) => c.stage === "won").length },
  ];

  async function handleMoveCard(cardId: string, newStage: string) {
    const newStatus = STAGE_TO_STATUS[newStage];
    if (!newStatus) return;

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === cardId ? { ...l, status: newStatus as any } : l)),
    );

    // Persist to Supabase
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        ...(newStatus === "won" ? { won_at: new Date().toISOString() } : {}),
      })
      .eq("id", cardId);

    if (error) {
      console.error("Failed to update lead status:", error);
      // Revert on error — refetch
      const { data } = await supabase
        .from("leads")
        .select("id, status")
        .eq("id", cardId)
        .single();
      if (data) {
        setLeads((prev) =>
          prev.map((l) => (l.id === cardId ? { ...l, status: data.status } : l)),
        );
      }
    }
  }

  return (
    <>
      <Topbar title="Deal Pipeline" subtitle={`${leads.length} leads · Drag to update stage`} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="bg-surface border border-border1 rounded-lg shadow-sm">
          <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
            <div className="text-[13px] font-bold">All Deals — Kanban</div>
            <div className="text-[11px] text-ink-3">
              Drag cards between columns to update lead status
            </div>
          </div>
          {loading ? (
            <div className="p-10 text-center text-xs text-ink-3">Loading pipeline...</div>
          ) : (
            <KanbanBoard columns={columns} cards={cards} onMoveCard={handleMoveCard} />
          )}
        </div>
      </div>
    </>
  );
}
