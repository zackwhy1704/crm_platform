# Deployment Guide

## Phase 0 — Local static UI (Week 1, no backend needed)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

Visit:
- `/` — landing
- `/agency/dashboard` — agency console
- `/client/leads` — client portal

All data is from `src/lib/mock-data.ts`. No API calls, no DB.

## Phase 1 — Full local stack (Week 2)

### Prereqs
- Docker Desktop
- Node 20+
- Python 3.11+ (optional, only if running backend outside Docker)

### Start backend

```bash
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY (for Claude), set FAKE_WHATSAPP=true for dev
docker compose up
# → backend at http://localhost:8000
# → Postgres at localhost:5432
# → Redis at localhost:6379
```

### Test ingestion

```bash
curl -X POST http://localhost:8000/api/leads/ingest \
  -H "Authorization: Bearer dev-secret-change-me" \
  -H "Content-Type: application/json" \
  -d @backend/tests/fixtures/sample_meta_lead.json
```

### Run backend tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/
```

## Phase 2 — Production

### 1. Supabase project

1. Create a project at supabase.com — region `ap-southeast-1` (Singapore)
2. Name: `crm-platform-sg`
3. Note the project URL + anon key + service role key → `.env`
4. Apply migrations:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
5. Create the first agency user via Supabase Auth dashboard, then manually insert row in `user_profiles` with `role='agency'`

### 2. Backend on Railway

1. `railway init` in `crm_platform/backend/`
2. Add services:
   - **backend** — uses `Dockerfile`, CMD from Dockerfile
   - **worker** — uses same image, override CMD to Celery worker
   - **redis** — Railway's managed Redis plugin
3. Set env vars (all from `.env.example`) in Railway dashboard
4. Deploy: `railway up`
5. Grab the public URL → goes into frontend `NEXT_PUBLIC_BACKEND_URL`

### 3. Frontend on Vercel

1. `vercel link` in `crm_platform/frontend/`
2. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BACKEND_URL`
3. Deploy: `vercel --prod`

### 4. Meta WhatsApp Business API setup

1. Create Meta Business app at developers.facebook.com
2. Add WhatsApp product
3. For M1 dev: use the free test phone number (max 5 recipients)
4. For production: buy a number from Twilio SG or similar, register via Meta WABA
5. Generate system user token → `WHATSAPP_TOKEN` env var
6. Get phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
7. Subscribe webhook: `https://<backend-url>/webhooks/whatsapp`
8. Verify token must match `WHATSAPP_VERIFY_TOKEN`

### 5. Meta Lead Ads subscription

1. In same Meta app, add Lead Ads webhook field
2. Webhook URL: `https://<backend-url>/webhooks/meta/lead-ads`
3. Verify token: `META_LEAD_ADS_VERIFY_TOKEN`
4. App secret: `META_APP_SECRET` (for HMAC verify)

## Cost estimate at pilot scale

| Service | Tier | Cost/month |
|---|---|---|
| Railway (backend+worker+redis) | Hobby | ~$5-10 |
| Vercel (frontend) | Hobby | $0 |
| Supabase | Free tier | $0 |
| Claude API (Haiku) | Pay-as-you-go | ~$1-5 |
| Meta WA API (conversation-based) | Pay-as-you-go | ~$5-20 |
| **Total** | | **~$15-40/mo** |

Scales linearly with lead volume. First real revenue-bearing client should cover infrastructure easily.
