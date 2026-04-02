from pathlib import Path
import sys
import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file
load_dotenv(dotenv_path=Path(__file__).resolve().with_name(".env"), override=True)

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database import Base, engine, migrate_legacy_users_schema
from backend.routes.auth import router as auth_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.records import router as records_router
from backend.routes.users import router as users_router

# Import models so SQLAlchemy metadata includes all tables.
from backend.models import record, user  # noqa: F401

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="Finance Dashboard API",
    description="Backend APIs for authentication, records management, and dashboard analytics.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def create_tables_on_startup():
    """Create missing tables, but do not crash startup on transient DB network errors."""
    try:
        migrate_legacy_users_schema()
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        logger.warning(
            "Database is unreachable during startup; schema sync skipped. "
            "The API is up, but DB-backed endpoints may fail until connectivity is restored. "
            "If you are using Supabase direct host and your network lacks IPv6, switch DATABASE_URL "
            "to Supabase Transaction/Session Pooler (IPv4) URL. Error: %s",
            exc,
        )


@app.get("/", tags=["Health"])
def root_health_check():
    return {"message": "Finance Dashboard API is running"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(records_router)
app.include_router(dashboard_router)
