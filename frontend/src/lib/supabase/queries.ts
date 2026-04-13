/**
 * Server-side Supabase queries for all pages.
 * These run in Server Components — no client bundle impact.
 * RLS is bypassed here since we use the anon key without auth for now.
 * When auth is wired, these will automatically respect RLS.
 */
import { createClient } from "./server";
import type { Lead, AnalyticsData, SourcePlatform } from "../types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select(`
      id, status, industry, source_platform, ai_score, ai_verdict, ai_summary,
      assigned_client_id, created_at,
      lead_contacts ( name, wa_phone, email ),
      lead_form_answers ( answers )
    `)
    .order("created_at", { ascending: false });

  if (!leads) return [];

  return leads.map((l: any) => ({
    id: l.id,
    name: l.lead_contacts?.name ?? "Unknown",
    email: l.lead_contacts?.email ?? undefined,
    phone: l.lead_contacts?.wa_phone ?? undefined,
    status: l.status,
    score: l.ai_score ?? 0,
    source: l.source_platform as SourcePlatform,
    industry: l.industry ?? undefined,
    summary: l.ai_summary ?? undefined,
    assignedClientId: l.assigned_client_id ?? undefined,
    formAnswers: l.lead_form_answers?.answers ?? undefined,
    createdAt: l.created_at,
  }));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();
  const { data: l } = await supabase
    .from("leads")
    .select(`
      id, status, industry, source_platform, ai_score, ai_verdict, ai_summary,
      assigned_client_id, created_at,
      lead_contacts ( name, wa_phone, email ),
      lead_form_answers ( answers )
    `)
    .eq("id", id)
    .single();

  if (!l) return null;

  return {
    id: l.id,
    name: (l as any).lead_contacts?.name ?? "Unknown",
    email: (l as any).lead_contacts?.email ?? undefined,
    phone: (l as any).lead_contacts?.wa_phone ?? undefined,
    status: l.status as any,
    score: l.ai_score ?? 0,
    source: l.source_platform as SourcePlatform,
    industry: l.industry ?? undefined,
    summary: l.ai_summary ?? undefined,
    assignedClientId: l.assigned_client_id ?? undefined,
    formAnswers: (l as any).lead_form_answers?.answers ?? undefined,
    createdAt: l.created_at,
  };
}

export async function getMetrics() {
  const supabase = await createClient();

  const { count: totalLeads } = await supabase.from("leads").select("*", { count: "exact", head: true });
  const { count: qualifiedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .in("status", ["qualified_hot", "qualified_warm", "assigned", "contacted", "in_progress", "won"]);
  const { count: newThisWeek } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
  const { count: wonCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "won");

  return {
    totalLeads: totalLeads ?? 0,
    qualifiedLeads: qualifiedLeads ?? 0,
    newThisWeek: newThisWeek ?? 0,
    wonDeals: wonCount ?? 0,
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("status, source_platform, ai_score, created_at");

  const all = leads ?? [];
  const total = all.length;
  const qualified = all.filter((l: any) =>
    ["qualified_hot", "qualified_warm", "assigned", "contacted", "in_progress", "won"].includes(l.status),
  ).length;
  const avgScore = total > 0 ? Math.round(all.reduce((s: number, l: any) => s + (l.ai_score ?? 0), 0) / total) : 0;

  // By source
  const bySource: Record<string, number> = {};
  all.forEach((l: any) => { bySource[l.source_platform] = (bySource[l.source_platform] ?? 0) + 1; });

  // By status
  const byStatus: Record<string, number> = {};
  all.forEach((l: any) => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });

  // Funnel
  const assigned = all.filter((l: any) => ["assigned", "contacted", "in_progress", "won", "lost"].includes(l.status)).length;
  const contacted = all.filter((l: any) => ["contacted", "in_progress", "won", "lost"].includes(l.status)).length;
  const won = all.filter((l: any) => l.status === "won").length;

  return {
    totalLeads: total,
    qualifiedLeads: qualified,
    qualificationRate: total > 0 ? Math.round((qualified / total) * 1000) / 10 : 0,
    avgScore,
    leadsBySource: bySource as any,
    leadsByStatus: byStatus,
    conversionFunnel: [
      { stage: "Leads In", count: total },
      { stage: "AI Qualified", count: qualified },
      { stage: "Assigned", count: assigned },
      { stage: "Contacted", count: contacted },
      { stage: "Won", count: won },
    ],
    recentTrend: [], // Would need date bucketing — skip for now
  };
}

export async function getWAMessages(leadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wa_messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  return data ?? [];
}
