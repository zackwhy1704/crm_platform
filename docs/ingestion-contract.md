# Lead Ingestion Contract

All lead sources — Meta Lead Ads, landing pages, manual entry, future TikTok/Google — normalise to this single schema before entering the qualification pipeline.

## Endpoint

```
POST /api/leads/ingest
Authorization: Bearer <INTERNAL_API_SECRET>
Content-Type: application/json
```

## Payload schema

```json
{
  "source_platform": "meta_facebook",
  "source_campaign_id": "23859123458",
  "source_ad_id": "23859001234",
  "source_form_id": "form_reno_sg_v3",
  "niche": "renovation",
  "contact": {
    "name": "Sarah Tan",
    "wa_phone": "+6591234567",
    "email": "sarah@example.com",
    "wa_optin": true
  },
  "form_answers": {
    "property_type": "HDB 4-room",
    "area": "Tampines",
    "budget_hint": "$30,000-$50,000",
    "timeline_hint": "Within 6 months"
  },
  "utm": {
    "source": "facebook",
    "medium": "paid",
    "campaign": "reno_sg_homeowners_apr26",
    "content": "carousel_kitchen_v2"
  },
  "consent": {
    "contact": true,
    "storage": true,
    "share_with_client": true,
    "timestamp": "2026-04-11T14:23:01Z"
  }
}
```

## Field notes

| Field | Required | Notes |
|---|---|---|
| `source_platform` | ✅ | Enum: `meta_facebook`, `meta_instagram`, `google`, `tiktok`, `landing_page`, `manual` |
| `niche` | ✅ | M1: only `renovation` accepted |
| `contact.wa_phone` | ✅ | E.164 format, must include country code |
| `contact.wa_optin` | ✅ | Must be `true` — no WA contact without explicit consent |
| `form_answers.*` | ⚠️ | Hints only. Real BANT values collected via qualification conversation. |
| `consent.*` | ✅ | All three must be `true`. Ingestion fails otherwise (PDPA requirement). |

## Response

```json
// 200 OK
{
  "status": "accepted",
  "lead_id": "ld_01HK9X2..."
}

// 409 Conflict — duplicate within 30 days
{
  "status": "duplicate",
  "existing_lead_id": "ld_01HK8Y5..."
}

// 422 Unprocessable — PDPA consent missing
{
  "error": "consent_required",
  "detail": "All three consent fields must be true"
}
```

## Direct Meta webhook path

If the lead comes via Meta Lead Ads directly (bypassing any third-party automation), the backend has a dedicated endpoint at `POST /webhooks/meta/lead-ads` that:

1. Verifies HMAC signature using `META_APP_SECRET`
2. Fetches full lead data from Graph API using the leadgen_id
3. Normalises to this schema internally
4. Forwards to the same ingestion pipeline

Both paths reach the same code in `backend/app/ingestion/normaliser.py`.
