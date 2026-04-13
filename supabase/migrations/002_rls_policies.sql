-- ============================================================================
-- Row Level Security Policies
--
-- Core principle:
--   - Agency users (role='agency') → full read/write on everything
--   - Client users (role='client') → only see leads WHERE assigned_client_id = their client_id
--                                    AND status IN (assigned, contacted, in_progress, won, lost)
--   - Anonymous (API ingestion) → blocked; use service role key for writes from backend
-- ============================================================================

alter table clients enable row level security;
alter table user_profiles enable row level security;
alter table leads enable row level security;
alter table lead_contacts enable row level security;
alter table lead_form_answers enable row level security;
alter table consent_log enable row level security;
alter table wa_sessions enable row level security;
alter table wa_messages enable row level security;
alter table lead_assignments enable row level security;
alter table client_lead_stages enable row level security;
alter table ad_events enable row level security;

-- ----------------------------------------------------------------------------
-- Helper: get current user's role + client_id from user_profiles
-- ----------------------------------------------------------------------------

create or replace function auth_role() returns text
language sql stable security definer as $$
  select role::text from user_profiles where user_id = auth.uid();
$$;

create or replace function auth_client_id() returns uuid
language sql stable security definer as $$
  select client_id from user_profiles where user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- user_profiles — users can read their own profile; agency can read all
-- ----------------------------------------------------------------------------

create policy "users read own profile"
  on user_profiles for select
  using (user_id = auth.uid() or auth_role() = 'agency');

create policy "agency manages profiles"
  on user_profiles for all
  using (auth_role() = 'agency');

-- ----------------------------------------------------------------------------
-- clients — agency reads/writes all; client reads only their own row
-- ----------------------------------------------------------------------------

create policy "agency full access clients"
  on clients for all
  using (auth_role() = 'agency');

create policy "client reads own record"
  on clients for select
  using (auth_role() = 'client' and id = auth_client_id());

-- ----------------------------------------------------------------------------
-- leads — agency sees all; clients see only their assigned, post-assignment leads
-- ----------------------------------------------------------------------------

create policy "agency full access leads"
  on leads for all
  using (auth_role() = 'agency');

create policy "client reads assigned leads"
  on leads for select
  using (
    auth_role() = 'client'
    and assigned_client_id = auth_client_id()
    and status in ('assigned', 'contacted', 'in_progress', 'won', 'lost')
  );

-- ----------------------------------------------------------------------------
-- lead_contacts — same visibility as leads
-- ----------------------------------------------------------------------------

create policy "agency full access contacts"
  on lead_contacts for all
  using (auth_role() = 'agency');

create policy "client reads contacts of assigned leads"
  on lead_contacts for select
  using (
    auth_role() = 'client'
    and exists (
      select 1 from leads
      where leads.id = lead_contacts.lead_id
        and leads.assigned_client_id = auth_client_id()
        and leads.status in ('assigned', 'contacted', 'in_progress', 'won', 'lost')
    )
  );

-- ----------------------------------------------------------------------------
-- lead_form_answers — same visibility
-- ----------------------------------------------------------------------------

create policy "agency full access form answers"
  on lead_form_answers for all
  using (auth_role() = 'agency');

create policy "client reads form answers of assigned leads"
  on lead_form_answers for select
  using (
    auth_role() = 'client'
    and exists (
      select 1 from leads
      where leads.id = lead_form_answers.lead_id
        and leads.assigned_client_id = auth_client_id()
    )
  );

-- ----------------------------------------------------------------------------
-- wa_messages — client sees only messages for their assigned leads
-- Clients CAN insert outbound messages (their replies) via backend API.
-- ----------------------------------------------------------------------------

create policy "agency full access wa messages"
  on wa_messages for all
  using (auth_role() = 'agency');

create policy "client reads wa messages of assigned leads"
  on wa_messages for select
  using (
    auth_role() = 'client'
    and exists (
      select 1 from leads
      where leads.id = wa_messages.lead_id
        and leads.assigned_client_id = auth_client_id()
    )
  );

-- ----------------------------------------------------------------------------
-- wa_sessions — agency only (internal state machine)
-- ----------------------------------------------------------------------------

create policy "agency only wa sessions"
  on wa_sessions for all
  using (auth_role() = 'agency');

-- ----------------------------------------------------------------------------
-- client_lead_stages — client can read+update their own, agency can read all
-- ----------------------------------------------------------------------------

create policy "agency reads all stages"
  on client_lead_stages for select
  using (auth_role() = 'agency');

create policy "client manages own stages"
  on client_lead_stages for all
  using (auth_role() = 'client' and client_id = auth_client_id());

-- ----------------------------------------------------------------------------
-- consent_log, lead_assignments, ad_events — agency only
-- ----------------------------------------------------------------------------

create policy "agency only consent log"
  on consent_log for all
  using (auth_role() = 'agency');

create policy "agency only assignments"
  on lead_assignments for all
  using (auth_role() = 'agency');

create policy "agency only ad events"
  on ad_events for all
  using (auth_role() = 'agency');
