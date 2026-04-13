/**
 * Mock data for static UI — generic lead management.
 * Replaced by Supabase queries when wired.
 */
import type { Lead, WAMessage, MetricCardData, AnalyticsData } from "./types";

export const mockMetrics: MetricCardData[] = [
  { label: "Active Leads", value: "48", delta: "+12%", deltaDirection: "up", color: "blue" },
  { label: "Qualified (Week)", value: "17", delta: "+23%", deltaDirection: "up", color: "green" },
  { label: "AI Conversations", value: "127", delta: "94% automated", color: "amber" },
  { label: "Assigned to Clients", value: "31", delta: "+8%", deltaDirection: "up", color: "purple" },
];

export const mockLeads: Lead[] = [
  {
    id: "ld_001",
    name: "Sarah Tan",
    company: "Tan Holdings",
    email: "sarah@tanholdings.com",
    phone: "+6591234567",
    status: "qualified_hot",
    score: 88,
    source: "meta_facebook",
    industry: "renovation",
    createdAt: "2026-04-11T09:12:00Z",
    summary: "Looking for full service, confirmed $30-60k budget, wants to start in July. Comparing 2 other firms.",
    formAnswers: { interest: "Full renovation", budget: "$30k-$60k", timeline: "ASAP" },
  },
  {
    id: "ld_002",
    name: "Marcus Lim",
    company: "Lim & Sons",
    email: "marcus@limsons.sg",
    status: "qualified_warm",
    score: 76,
    source: "meta_instagram",
    createdAt: "2026-04-11T07:40:00Z",
    dealValue: 28000,
    formAnswers: { interest: "EC renovation", budget: "$50k+", timeline: "3-6 months" },
  },
  {
    id: "ld_003",
    name: "Diana Ong",
    company: "Ong Interior",
    status: "nurture",
    score: 54,
    source: "meta_instagram",
    createdAt: "2026-04-11T05:22:00Z",
    formAnswers: { interest: "Kitchen upgrade", budget: "$5k-$20k", timeline: "Just exploring" },
  },
  {
    id: "ld_004",
    name: "Raj Kumar",
    email: "raj@email.com",
    status: "disqualified",
    score: 30,
    source: "google",
    createdAt: "2026-04-11T04:01:00Z",
    formAnswers: { interest: "General enquiry", budget: "Under $5k" },
  },
  {
    id: "ld_005",
    name: "Priya Nair",
    company: "Nair Ventures",
    status: "contacted",
    score: 65,
    source: "meta_facebook",
    createdAt: "2026-04-10T22:10:00Z",
    formAnswers: { interest: "Office fit-out", budget: "$20k-$50k", timeline: "1-3 months" },
  },
  {
    id: "ld_006",
    name: "James Wong",
    company: "Wong Properties",
    status: "won",
    score: 92,
    source: "google",
    createdAt: "2026-04-08T10:00:00Z",
    dealValue: 45000,
    formAnswers: { interest: "Full reno", budget: "$50k+", timeline: "ASAP" },
  },
  {
    id: "ld_007",
    name: "Lisa Chen",
    status: "new",
    score: 0,
    source: "tiktok",
    createdAt: "2026-04-11T11:30:00Z",
  },
];

export const mockMessages: Record<string, WAMessage[]> = {
  ld_001: [
    {
      id: "m1", leadId: "ld_001", direction: "inbound", senderType: "lead",
      messageType: "text", body: "Hi, I'm interested in your services. Can you tell me more?",
      createdAt: "2026-04-11T09:12:00Z",
    },
    {
      id: "m2", leadId: "ld_001", direction: "outbound", senderType: "ai",
      messageType: "text",
      body: "Hi Sarah! 👋 Thanks for reaching out. I'm Ava — just a few quick questions so we can match you with the right person. What are you looking for?",
      createdAt: "2026-04-11T09:12:15Z",
    },
    {
      id: "m3", leadId: "ld_001", direction: "inbound", senderType: "lead",
      messageType: "text", body: "Full renovation for my place",
      createdAt: "2026-04-11T09:12:45Z",
    },
    {
      id: "m4", leadId: "ld_001", direction: "outbound", senderType: "ai",
      messageType: "interactive_list",
      body: "Got it! What's your rough budget range?",
      createdAt: "2026-04-11T09:12:55Z",
    },
  ],
};

export const mockPipelineColumns = [
  { stage: "new", label: "New", count: 5, value: 0 },
  { stage: "qualified", label: "Qualified", count: 7, value: 62500 },
  { stage: "proposal", label: "Proposal", count: 3, value: 62000 },
  { stage: "negotiation", label: "Negotiation", count: 2, value: 45500 },
  { stage: "won", label: "Won", count: 8, value: 94200 },
];

export const mockAnalytics: AnalyticsData = {
  totalLeads: 248,
  qualifiedLeads: 86,
  qualificationRate: 34.7,
  avgScore: 58,
  leadsBySource: {
    meta_facebook: 98,
    meta_instagram: 62,
    google: 45,
    tiktok: 28,
    landing_page: 12,
    manual: 3,
  },
  leadsByStatus: {
    new: 12,
    qualifying: 5,
    qualified_hot: 14,
    qualified_warm: 22,
    nurture: 68,
    disqualified: 74,
    assigned: 18,
    contacted: 11,
    in_progress: 8,
    won: 12,
    lost: 4,
  },
  conversionFunnel: [
    { stage: "Leads In", count: 248 },
    { stage: "AI Qualified", count: 86 },
    { stage: "Assigned", count: 72 },
    { stage: "Contacted", count: 58 },
    { stage: "Won", count: 12 },
  ],
  recentTrend: [
    { date: "Apr 5", leads: 32, qualified: 11 },
    { date: "Apr 6", leads: 28, qualified: 9 },
    { date: "Apr 7", leads: 41, qualified: 15 },
    { date: "Apr 8", leads: 36, qualified: 14 },
    { date: "Apr 9", leads: 38, qualified: 12 },
    { date: "Apr 10", leads: 44, qualified: 16 },
    { date: "Apr 11", leads: 29, qualified: 9 },
  ],
};
