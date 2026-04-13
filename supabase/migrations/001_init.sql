-- ============================================================================
-- CRM Platform — Initial schema
-- Generic lead management platform. Single-tenant (one agency). Multi-client.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type user_role as enum ('agency', 'client');

create type lead_status as enum (
  'new',              -- just ingested, welcome sent
  'qualifying',       -- in active WA qualification conversation
  'qualified_hot',    -- score >= 75
  'qualified_warm',   -- 55-74
  'nurture',          -- 35-54, entered nurture sequence
  'disqualified',     -- <35 or hard-fail (renter)
  'assigned',         -- qualified and given to a client
  'contacted',        -- client has opened conversation
  'in_progress',      -- client actively working the lead
  'won',              -- deal closed
  'lost',             -- deal lost
  'dnc_blocked',      -- phone on DNC (future, voice only)
  'duplicate'         -- same phone in last 30 days
);

create type source_platform as enum (
  'meta_facebook',
  'meta_instagram',
  'google',
  'tiktok',
  'landing_page',
  'manual'
);

create type wa_session_state as enum (
  'new',
  'qualifying',     -- mid-conversation, dynamic steps
  'complete'
);

create type assignment_mode as enum (
  'manual',
  'round_robin',
  'score_routed',
  'geo_routed'
);

-- ============================================================================
-- CLIENTS (SME businesses that receive qualified leads)
-- ============================================================================

create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  industry text,                               -- e.g. 'renovation', 'property', 'healthcare', etc. nullable = generic
  plan text not null default 'starter',        -- starter | pro | enterprise
  service_areas text[] default '{}',
  wa_phone text,                               -- where to send "new lead" alerts
  portal_subdomain text unique,
  qualification_config jsonb default '{}'::jsonb,  -- custom questions, scoring rules per client
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Agency users and client users both auth via Supabase Auth (auth.users).
-- This table maps each auth user to a role + optional client_id.

create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  client_id uuid references clients(id) on delete set null,  -- null for agency users
  full_name text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- LEADS (core)
-- ============================================================================

create table leads (
  id uuid primary key default uuid_generate_v4(),
  status lead_status not null default 'new',
  industry text,                             -- inherited from client or set at capture

  -- Source attribution
  source_platform source_platform not null,
  source_campaign_id text,
  source_ad_id text,
  source_form_id text,
  utm jsonb default '{}'::jsonb,

  -- Scoring
  ai_score integer,                    -- 0-100
  ai_verdict text,                     -- qualified_hot | qualified_warm | nurture | disqualified
  ai_summary text,                     -- 2-sentence summary for SME client

  -- Assignment
  assigned_client_id uuid references clients(id) on delete set null,
  assigned_at timestamptz,

  -- Timestamps
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  contacted_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,

  -- Dedupe
  phone_hash text not null unique
);

create index idx_leads_status on leads(status);
create index idx_leads_assigned_client on leads(assigned_client_id);
create index idx_leads_created_at on leads(created_at desc);
create index idx_leads_phone_hash on leads(phone_hash);

-- PII lives in a separate table so we can restrict access more tightly.
-- Phone is encrypted at rest via pgcrypto in M2.
create table lead_contacts (
  lead_id uuid primary key references leads(id) on delete cascade,
  name text,
  wa_phone text not null,              -- E.164, will be encrypted in M2
  email text,
  wa_optin boolean not null default true
);

create index idx_lead_contacts_wa_phone on lead_contacts(wa_phone);

-- Raw form answers (property type, area, budget range, etc.) — niche-specific JSON.
create table lead_form_answers (
  lead_id uuid primary key references leads(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb
);

-- PDPA consent audit trail (immutable, insert-only)
create table consent_log (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  contact boolean not null,
  storage boolean not null,
  share_with_client boolean not null,
  ip_address text,
  logged_at timestamptz not null default now()
);

-- ============================================================================
-- WHATSAPP CONVERSATIONS
-- ============================================================================

-- One session per lead, tracks qualification state machine progress.
create table wa_sessions (
  lead_id uuid primary key references leads(id) on delete cascade,
  state wa_session_state not null default 'new',
  collected jsonb not null default '{}'::jsonb,   -- dynamic key-value pairs from qualification questions
  current_step integer not null default 0,       -- index into qualification_config.questions
  turn_count integer not null default 0,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Every message in both directions. Fuels the inbox UI in agency + client portal.
create table wa_messages (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('lead', 'ai', 'agency', 'client')),
  message_type text not null,          -- text | interactive_button | interactive_list | image | ...
  content jsonb not null,              -- full message body
  wa_message_id text,                  -- Meta's message id
  created_at timestamptz not null default now()
);

create index idx_wa_messages_lead on wa_messages(lead_id, created_at desc);

-- ============================================================================
-- ASSIGNMENT + STAGE TRACKING
-- ============================================================================

create table lead_assignments (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  mode assignment_mode not null,
  assigned_by uuid references auth.users(id),   -- null if auto
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz                      -- null if currently active
);

create index idx_assignments_lead on lead_assignments(lead_id);
create index idx_assignments_client on lead_assignments(client_id);

-- Client-specific stage (their pipeline within the leads assigned to them)
create table client_lead_stages (
  lead_id uuid primary key references leads(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  stage text not null default 'new',            -- new | contacted | in_progress | proposal | won | lost
  notes text,
  deal_value numeric(10, 2),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- AD EVENTS (for attribution analytics)
-- ============================================================================

create table ad_events (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete cascade,
  platform source_platform not null,
  campaign_id text,
  adset_id text,
  ad_id text,
  event_type text not null,            -- impression | click | form_submit | qualified | won
  event_time timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

create index idx_ad_events_lead on ad_events(lead_id);
create index idx_ad_events_platform_time on ad_events(platform, event_time desc);

-- ============================================================================
-- SEED DATA (dev)
-- ============================================================================

-- Real estate pilot client
insert into clients (name, industry, plan, service_areas, wa_phone, qualification_config)
values (
  'PropNest Realty',
  'real_estate',
  'pro',
  array['Central', 'East', 'North-East'],
  '+6580000000',
  '{
    "questions": [
      {"key": "intent", "text": "Are you looking to buy, sell, or rent?", "type": "buttons", "options": ["Buy", "Sell", "Rent"]},
      {"key": "property_type", "text": "What type of property?", "type": "list", "options": ["HDB", "EC (Executive Condo)", "Private Condo", "Landed", "Commercial"]},
      {"key": "budget", "text": "What is your budget range?", "type": "list", "options": ["Below $500k", "$500k - $1M", "$1M - $2M", "$2M - $5M", "Above $5M"]},
      {"key": "location", "text": "Any preferred location or district?", "type": "text"},
      {"key": "timeline", "text": "When are you looking to move?", "type": "buttons", "options": ["Within 3 months", "3-6 months", "Just exploring"]},
      {"key": "financing", "text": "Do you have financing in place?", "type": "buttons", "options": ["Yes, pre-approved", "In progress", "Not yet"]}
    ],
    "qualify_threshold": 50,
    "hot_threshold": 70,
    "disqualify_rules": []
  }'::jsonb
);
