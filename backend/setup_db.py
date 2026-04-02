#!/usr/bin/env python
"""Create all tables on the configured Supabase PostgreSQL database."""

import sys
from pathlib import Path

from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load environment variables before importing database module.
load_dotenv()


def setup_database():
    """Create tables using DATABASE_URL from environment."""

    print("Setting up Supabase PostgreSQL schema...")

    try:
        from backend.database import Base, engine
        from backend.models import user, record  # noqa: F401

        Base.metadata.create_all(bind=engine)
        print("All tables created successfully.")
        print("Run API: uvicorn main:app --reload")
    except Exception as exc:
        print(f"Database setup failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    setup_database()
