"""
Celery application configuration for CRM Platform.

Ported from multi_platform_automation/workers/celery_app.py.
Queues are specific to lead qualification (not social posting).
"""
import os

from celery import Celery
from dotenv import load_dotenv
from kombu import Exchange, Queue

load_dotenv()

celery_app = Celery(
    "crm_platform",
    include=[
        "app.workers.lead_qualification",
        "app.workers.notification",
        "app.workers.nurture",
    ],
)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app.conf.broker_url = REDIS_URL
celery_app.conf.result_backend = REDIS_URL

# --- Exchanges ---
qual_exchange = Exchange("qualification", type="direct")
notif_exchange = Exchange("notifications", type="direct")
nurture_exchange = Exchange("nurture", type="direct")

# --- Queues ---
celery_app.conf.task_queues = (
    Queue(
        "lead_qualification", qual_exchange,
        routing_key="qualification.run",
        queue_arguments={"x-max-priority": 10},
    ),
    Queue(
        "notifications", notif_exchange,
        routing_key="notifications.send",
        queue_arguments={"x-max-priority": 8},
    ),
    Queue(
        "nurture", nurture_exchange,
        routing_key="nurture.step",
        queue_arguments={"x-max-priority": 3},
    ),
)

# --- Routing ---
celery_app.conf.task_routes = {
    "app.workers.lead_qualification.start_conversation": {"queue": "lead_qualification"},
    "app.workers.lead_qualification.process_reply": {"queue": "lead_qualification"},
    "app.workers.notification.notify_client_new_lead": {"queue": "notifications"},
    "app.workers.notification.notify_lead_welcome": {"queue": "notifications"},
    "app.workers.nurture.run_step": {"queue": "nurture"},
}

# --- Worker config ---
celery_app.conf.worker_prefetch_multiplier = 1
celery_app.conf.worker_max_tasks_per_child = 50
celery_app.conf.task_acks_late = True
celery_app.conf.task_reject_on_worker_lost = True

# --- Timeouts ---
celery_app.conf.task_time_limit = 300
celery_app.conf.task_soft_time_limit = 270

# --- Serialization ---
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "Asia/Singapore"
celery_app.conf.enable_utc = True
celery_app.conf.result_expires = 3600

# --- Retries ---
celery_app.conf.task_default_retry_delay = 60
celery_app.conf.task_max_retries = 3

# --- Logging ---
celery_app.conf.worker_log_format = (
    "[%(asctime)s: %(levelname)s/%(processName)s] %(message)s"
)

# --- Eager mode for tests ---
celery_app.conf.task_always_eager = (
    os.getenv("CELERY_ALWAYS_EAGER", "False").lower() == "true"
)
