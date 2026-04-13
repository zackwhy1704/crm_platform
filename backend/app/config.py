"""
Central config loader. All env vars are read here — never import os.getenv elsewhere.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# --- Environment ---
ENV = os.getenv("ENV", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "dev-secret-change-me")

# --- Supabase / Postgres ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/crm_platform")

# --- Meta WhatsApp Cloud API ---
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")

# --- Meta Lead Ads ---
META_APP_SECRET = os.getenv("META_APP_SECRET", "")
META_LEAD_ADS_VERIFY_TOKEN = os.getenv("META_LEAD_ADS_VERIFY_TOKEN", "")

# --- Anthropic Claude ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

# --- Celery / Redis ---
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# --- Feature flags ---
FAKE_WHATSAPP = os.getenv("FAKE_WHATSAPP", "false").lower() == "true"  # M1 dev: log instead of send
FAKE_CLAUDE = os.getenv("FAKE_CLAUDE", "false").lower() == "true"      # M1 dev: canned responses
