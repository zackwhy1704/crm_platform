/**
 * Shared types — mirrors backend Supabase schema.
 * Generic lead management — no niche-specific fields.
 */

export type LeadStatus =
  | "new"
  | "qualifying"
  | "qualified_hot"
  | "qualified_warm"
  | "nurture"
  | "disqualified"
  | "assigned"
  | "contacted"
  | "in_progress"
  | "won"
  | "lost"
  | "dnc_blocked"
  | "duplicate";

export type SourcePlatform =
  | "meta_facebook"
  | "meta_instagram"
  | "google"
  | "tiktok"
  | "landing_page"
  | "manual";

export type PipelineStage = "new" | "qualified" | "proposal" | "negotiation" | "won";

export type UserRole = "agency" | "client";

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  score: number;
  source: SourcePlatform;
  industry?: string;
  summary?: string;
  dealValue?: number;
  assignedClientId?: string;
  formAnswers?: Record<string, string>;
  createdAt: string;
}

export interface WAMessage {
  id: string;
  leadId: string;
  direction: "inbound" | "outbound";
  senderType: "lead" | "ai" | "agency" | "client";
  messageType: "text" | "interactive_button" | "interactive_list";
  body: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  industry?: string;
  plan: "starter" | "pro" | "enterprise";
  serviceAreas: string[];
  qualificationConfig?: Record<string, unknown>;
}

export interface UserProfile {
  userId: string;
  role: UserRole;
  clientId?: string;
  fullName: string;
}

export interface MetricCardData {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down";
  color: "blue" | "green" | "amber" | "purple";
}

export interface AnalyticsData {
  totalLeads: number;
  qualifiedLeads: number;
  qualificationRate: number;
  avgScore: number;
  leadsBySource: Record<SourcePlatform, number>;
  leadsByStatus: Record<string, number>;
  conversionFunnel: { stage: string; count: number }[];
  recentTrend: { date: string; leads: number; qualified: number }[];
}
