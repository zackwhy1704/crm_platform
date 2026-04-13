# CRM Platform

AI-powered lead qualification and client management platform for Singapore SMEs.

**Pilot niche:** Renovation
**Status:** M0 — scaffolding phase

## Architecture

```
Meta Lead Ads ──► backend (Railway) ──► Supabase (ap-southeast-1) ◄── frontend (Vercel)
                       │                        ▲
                       └──► WA Cloud API ───────┘
                       └──► Claude Haiku (qualification)
```

- **backend/** — FastAPI + Celery (Python). Webhook receiver, WhatsApp client, Claude qualification engine, lead assignment worker. Deployed on Railway.
- **frontend/** — Next.js 16 + Tailwind + shadcn/ui. Agency console + Client portal. Deployed on Vercel.
- **supabase/** — Postgres schema, RLS policies, migrations.
- **docs/** — Architecture, deployment, ingestion contract.

## Quick start

See `docs/deployment.md` for full setup.

### Local dev (Week 1 static UI)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Local dev (Week 2+ full stack)

```bash
# Terminal 1 — backend
cd backend
docker compose up

# Terminal 2 — frontend
cd frontend
npm run dev
```

## Origin

Some infrastructure patterns (WhatsApp Cloud API client, Celery worker layout, Dockerfile, Caddy reverse proxy, Railway deploy config) were copied from `multi_platform_automation` — a separate live production project. This repo is an independent fork-by-copy and shares no runtime with the origin.
