-- Enable Supabase Realtime broadcasts on key tables.
-- Agency dashboard subscribes to:
--   - leads: new/updated rows → live pipeline kanban + metric counts
--   - wa_messages: new inbound → live inbox
--   - wa_sessions: state changes → qualification progress UI
-- Client portal subscribes to:
--   - leads (filtered by assigned_client_id via RLS)
--   - wa_messages (filtered via RLS)

alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table wa_messages;
alter publication supabase_realtime add table wa_sessions;
alter publication supabase_realtime add table client_lead_stages;
