"""
FastAPI entry point for CRM Platform backend.

Routes:
  GET  /health                     — health check
  POST /api/leads/ingest           — generic lead ingestion (manual + automation)
  GET  /webhooks/meta/lead-ads     — Meta webhook verification
  POST /webhooks/meta/lead-ads     — Meta Lead Ads webhook receiver
  GET  /webhooks/whatsapp          — WhatsApp webhook verification
  POST /webhooks/whatsapp          — WhatsApp incoming message webhook
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ENV, LOG_LEVEL
from app.api import leads, meta_webhook, whatsapp_webhook

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CRM Platform API",
    description="AI-powered lead qualification for SG SMEs. Pilot niche: renovation.",
    version="0.1.0",
)

# CORS — allow Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(meta_webhook.router, prefix="/webhooks/meta", tags=["meta-webhook"])
app.include_router(whatsapp_webhook.router, prefix="/webhooks/whatsapp", tags=["whatsapp-webhook"])


@app.get("/health")
async def health():
    return {"status": "ok", "env": ENV}


@app.on_event("startup")
async def startup():
    logger.info("CRM Platform backend starting in %s mode", ENV)
