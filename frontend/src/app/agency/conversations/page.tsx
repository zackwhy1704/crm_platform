"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

type Message = {
  id: string;
  direction: "inbound" | "outbound";
  senderType: string;
  messageType: string;
  body: string;
  createdAt: string;
};

type Filter = "all" | "qualified" | "new" | "nurture";

const FILTER_STATUSES: Record<Filter, string[] | null> = {
  all: null,
  qualified: ["qualified_hot", "qualified_warm", "assigned", "contacted", "in_progress"],
  new: ["new", "qualifying"],
  nurture: ["nurture", "disqualified"],
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Fetch leads
  useEffect(() => {
    async function fetchLeads() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("leads")
        .select(`
          id, status, ai_score, ai_summary, source_platform, created_at,
          lead_contacts ( name, wa_phone, email ),
          lead_form_answers ( answers )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        const mapped: Lead[] = data.map((l: any) => ({
          id: l.id,
          name: l.lead_contacts?.name ?? "Unknown",
          email: l.lead_contacts?.email ?? undefined,
          phone: l.lead_contacts?.wa_phone ?? undefined,
          status: l.status,
          score: l.ai_score ?? 0,
          source: l.source_platform,
          summary: l.ai_summary ?? undefined,
          formAnswers: l.lead_form_answers?.answers ?? undefined,
          createdAt: l.created_at,
        }));
        setLeads(mapped);
        if (mapped.length > 0 && !selectedId) setSelectedId(mapped[0].id);
      }
      setLoadingLeads(false);
    }
    fetchLeads();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch messages when selected lead changes
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }

    async function fetchMessages() {
      setLoadingMsgs(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("wa_messages")
        .select("id, direction, sender_type, message_type, content, created_at")
        .eq("lead_id", selectedId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data.map((m: any) => ({
          id: m.id,
          direction: m.direction,
          senderType: m.sender_type,
          messageType: m.message_type,
          body: m.content?.body ?? JSON.stringify(m.content),
          createdAt: m.created_at,
        })));
      } else {
        setMessages([]);
      }
      setLoadingMsgs(false);
    }
    fetchMessages();
  }, [selectedId]);

  // Apply filter
  const filteredLeads = leads.filter((l) => {
    const statuses = FILTER_STATUSES[filter];
    if (!statuses) return true;
    return statuses.includes(l.status);
  });

  const selectedLead = leads.find((l) => l.id === selectedId);

  const filterCounts: Record<Filter, number> = {
    all: leads.length,
    qualified: leads.filter((l) => FILTER_STATUSES.qualified!.includes(l.status)).length,
    new: leads.filter((l) => FILTER_STATUSES.new!.includes(l.status)).length,
    nurture: leads.filter((l) => FILTER_STATUSES.nurture!.includes(l.status)).length,
  };

  return (
    <>
      <Topbar title="Conversations" subtitle={`${leads.length} leads`} />
      <div className="flex-1 overflow-hidden p-5">
        <div className="grid grid-cols-[1fr_1.5fr] gap-3.5 h-full">
          {/* Left: Inbox list */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            {/* Filter tabs */}
            <div className="px-3.5 border-b border-border1">
              <div className="flex gap-0">
                {(["all", "qualified", "new", "nurture"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); }}
                    className={cn(
                      "py-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 -mb-px transition-colors capitalize flex items-center gap-1.5",
                      filter === f ? "text-accent border-accent" : "text-ink-3 border-transparent hover:text-ink"
                    )}
                  >
                    {f}
                    <span className={cn(
                      "text-[10px] min-w-4 text-center px-1 rounded-full",
                      filter === f ? "bg-accent text-white" : "bg-surface2 text-ink-3"
                    )}>
                      {filterCounts[f]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto">
              {loadingLeads ? (
                <div className="p-4 text-xs text-ink-3 text-center">Loading...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-4 text-xs text-ink-3 text-center">No leads in this category</div>
              ) : (
                filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedId(lead.id)}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3.5 py-2.5 border-b border-border1 last:border-0 cursor-pointer transition-colors text-left",
                      selectedId === lead.id ? "bg-accent-light/40" : "hover:bg-surface2"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-px",
                      selectedId === lead.id ? "bg-accent text-white" : "bg-accent/10 text-accent"
                    )}>
                      {lead.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-px">
                        <span className="text-xs font-bold truncate">{lead.name}</span>
                        <span className="text-[10px] text-ink-3 font-mono flex-shrink-0 ml-2">{timeAgo(lead.createdAt)}</span>
                      </div>
                      <div className="text-[11px] text-ink-3 truncate">
                        {lead.formAnswers?.intent ? `${lead.formAnswers.intent} · ${lead.formAnswers.property_type ?? ""}` : lead.email ?? "New lead"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-mono bg-surface2 text-ink-3 px-1 rounded">
                          {lead.score}
                        </span>
                        <span className={cn(
                          "text-[9px] font-semibold px-1.5 rounded-full capitalize",
                          lead.status.includes("hot") ? "bg-red-light text-red" :
                          lead.status.includes("warm") ? "bg-amber-light text-amber" :
                          lead.status === "nurture" ? "bg-surface2 text-ink-3" :
                          lead.status === "new" ? "bg-accent-light text-accent" :
                          "bg-surface2 text-ink-3"
                        )}>
                          {lead.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Conversation thread + detail */}
          <div className="bg-surface border border-border1 rounded-lg shadow-sm flex flex-col min-h-0">
            {selectedLead ? (
              <>
                {/* Header */}
                <div className="px-4 pt-3.5 pb-3 border-b border-border1 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold">{selectedLead.name}</div>
                    <div className="text-[11px] text-ink-3 mt-px">
                      Score {selectedLead.score} · {selectedLead.status.replace(/_/g, " ")}
                      {selectedLead.phone && ` · ${selectedLead.phone}`}
                    </div>
                  </div>
                  {selectedLead.formAnswers && (
                    <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                      {Object.entries(selectedLead.formAnswers).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="text-[9px] bg-surface2 text-ink-3 px-1.5 py-0.5 rounded">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                {selectedLead.summary && (
                  <div className="px-4 py-2 border-b border-border1 bg-accent-light/30">
                    <div className="text-[9.5px] text-accent font-bold mb-0.5">AI Summary</div>
                    <div className="text-[11px] text-ink-2 leading-relaxed">{selectedLead.summary}</div>
                  </div>
                )}

                {/* Message thread */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
                  {loadingMsgs ? (
                    <div className="text-xs text-ink-3 text-center py-8">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-xs text-ink-3 text-center py-8">No conversation yet</div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn("flex", m.direction === "outbound" ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                          m.direction === "outbound"
                            ? "bg-accent-light border border-accent/15 rounded-tr-none"
                            : "bg-surface2 border border-border1 rounded-tl-none"
                        )}>
                          {m.senderType === "ai" && (
                            <div className="text-[9px] text-accent font-bold mb-1">Ava AI</div>
                          )}
                          {m.senderType === "lead" && m.direction === "inbound" && (
                            <div className="text-[9px] text-ink-3 font-bold mb-1">{selectedLead.name}</div>
                          )}
                          <div>{m.body}</div>
                          <div className={cn(
                            "text-[8px] mt-1",
                            m.direction === "outbound" ? "text-accent/50" : "text-ink-3/50"
                          )}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply box */}
                <div className="p-3 border-t border-border1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a reply..."
                      className="flex-1 px-3 py-2 border border-border1 rounded text-xs outline-none focus:border-accent bg-surface"
                    />
                    <button className="px-4 py-2 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-ink-3">
                Select a lead to view conversation
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
