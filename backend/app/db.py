"""
Database connection helpers.

Two access paths:
  - Supabase Python client (for auth-aware, RLS-scoped queries from API routes)
  - Direct psycopg2 connection (for Celery workers that need raw SQL / bulk ops)

M1 stub.
"""
import logging
from typing import Optional

from app.config import DATABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase(use_service_role: bool = False):
    """Lazy singleton Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        try:
            from supabase import create_client
        except ImportError:
            logger.error("supabase-py not installed")
            return None
        key = SUPABASE_SERVICE_ROLE_KEY if use_service_role else SUPABASE_ANON_KEY
        if not SUPABASE_URL or not key:
            logger.warning("Supabase env vars not set — returning None")
            return None
        _supabase_client = create_client(SUPABASE_URL, key)
    return _supabase_client


def get_pg_connection():
    """Direct psycopg2 connection for raw SQL in workers."""
    import psycopg2
    return psycopg2.connect(DATABASE_URL)
