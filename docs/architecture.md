# Architecture

## Layers

```
Meta Lead Ads ──► backend gateway (FastAPI) ──► Celery queue ──► Supabase
                       │                             │
                       └─► WA Cloud API              └─► Claude Haiku
                                   ▲                         │
                                   │                         ▼
                              frontend (Next.js) ◄── Supabase Realtime
```

## Services

| Service | Runtime | Responsibility |
|---|---|---|
| backend/gateway | FastAPI on Railway | Webhook receiver, API endpoints, WA outbound |
| backend/worker | Celery on Railway | Async jobs: qualification, notifications, nurture |
| backend/redis | Redis on Railway | Celery broker + result backend |
| frontend | Next.js on Vercel | Agency console + Client portal |
| database | Supabase (ap-southeast-1) | Postgres + Auth + RLS + Realtime |

## Lead lifecycle

1. **Ingestion** — Meta Lead Ads webhook OR manual `/api/leads/ingest`
2. **Normalisation** — platform payload → internal schema
3. **Dedupe** — 30-day phone hash check
4. **Persist** — write to `leads` + `lead_contacts` + `consent_log`
5. **Welcome** — outbound WA with friendly intro
6. **Qualification** — BANT state machine via interactive buttons
7. **Scoring** — compute 0–100 score from structured answers
8. **Assignment** — assign to client (manual in M1, round-robin M2)
9. **Notification** — WA alert to client's account manager
10. **Client action** — client opens portal, replies to lead, updates stage
11. **Close** — won/lost outcome fed back to attribution (M3)

## State machine (qualification)

```
NEW
  └► welcome sent → AWAIT_PROPERTY_TYPE
AWAIT_PROPERTY_TYPE
  └► list reply received → AWAIT_OWNERSHIP
AWAIT_OWNERSHIP
  ├► "rent" → COMPLETE (verdict=DISQUALIFIED)
  └► "own"  → AWAIT_BUDGET
AWAIT_BUDGET
  └► list reply received → AWAIT_TIMELINE
AWAIT_TIMELINE
  └► button reply received → COMPLETE (verdict=QUALIFIED_HOT|WARM|NURTURE)
```

See `backend/app/qualification/state_machine.py` for the reference implementation.

## Tech stack summary

- **Frontend:** Next.js 15 App Router, Tailwind v3, TypeScript
- **Backend:** FastAPI + Celery + psycopg2
- **AI:** Claude Haiku 4.5 (anthropic-sdk)
- **Messaging:** Meta WhatsApp Cloud API (direct, no Twilio)
- **Database:** Supabase (Postgres + RLS + Realtime)
- **Deploy:** Railway (backend) + Vercel (frontend) + Supabase Cloud (db)
