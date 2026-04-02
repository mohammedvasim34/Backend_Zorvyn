import os
import socket
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from passlib.context import CryptContext
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

# Load DATABASE_URL from environment variable.
# Expected format:
# postgresql://username:password@host:5432/database_name?sslmode=require
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Configure it in backend/.env")

if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError("SQLite URLs are not supported. Use Supabase PostgreSQL DATABASE_URL")


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _inject_ipv4_hostaddr(database_url: str) -> str:
    """Inject hostaddr=<ipv4> into PostgreSQL URL query when IPv4 is forced.

    This avoids environments where IPv6 is selected first but is not routable.
    """
    parsed = urlparse(database_url)
    if not parsed.hostname:
        return database_url

    if "postgresql" not in parsed.scheme:
        return database_url

    port = parsed.port or 5432
    addr_info = socket.getaddrinfo(parsed.hostname, port, family=socket.AF_INET, type=socket.SOCK_STREAM)
    if not addr_info:
        return database_url

    ipv4 = addr_info[0][4][0]
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["hostaddr"] = ipv4

    return urlunparse(
        parsed._replace(query=urlencode(query))
    )


FORCE_IPV4 = _as_bool(os.getenv("DB_FORCE_IPV4"), default=False)
CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", "10"))

if FORCE_IPV4:
    try:
        DATABASE_URL = _inject_ipv4_hostaddr(DATABASE_URL)
    except Exception:
        # Keep the original URL if DNS resolution fails; startup handler will report DB issues.
        pass

# Create engine for PostgreSQL
# pool_pre_ping ensures connections are valid before use
engine = create_engine(
    DATABASE_URL,
    connect_args={"connect_timeout": CONNECT_TIMEOUT},
    pool_pre_ping=True,
    echo=False,  # Set to True for SQL debugging
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _is_bcrypt_hash(value: str) -> bool:
    return value.startswith("$2a$") or value.startswith("$2b$") or value.startswith("$2y$")


def migrate_legacy_users_schema() -> None:
    """Best-effort migration for legacy users table shape.

    Legacy deployments used `password` and `role_id`; current code expects
    `hashed_password` and enum `role`.
    """

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("users")}

    with engine.begin() as conn:
        enum_labels = conn.execute(
            text(
                """
                SELECT e.enumlabel
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'userrole'
                ORDER BY e.enumsortorder
                """
            )
        ).scalars().all()

        def _label(preferred: str) -> str:
            for item in enum_labels:
                if item.lower() == preferred.lower():
                    return item
            return preferred

        viewer_label = _label("viewer")
        analyst_label = _label("analyst")
        admin_label = _label("admin")
        viewer_sql = viewer_label.replace("'", "''")
        analyst_sql = analyst_label.replace("'", "''")
        admin_sql = admin_label.replace("'", "''")

        if "hashed_password" not in columns:
            if "password" in columns:
                conn.execute(text("ALTER TABLE users RENAME COLUMN password TO hashed_password"))
            else:
                conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))

        if "role" not in columns:
            conn.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                            CREATE TYPE userrole AS ENUM ('viewer', 'analyst', 'admin');
                        END IF;
                    END
                    $$;
                    """
                )
            )

            enum_labels = conn.execute(
                text(
                    """
                    SELECT e.enumlabel
                    FROM pg_type t
                    JOIN pg_enum e ON t.oid = e.enumtypid
                    WHERE t.typname = 'userrole'
                    ORDER BY e.enumsortorder
                    """
                )
            ).scalars().all()
            viewer_label = _label("viewer")
            analyst_label = _label("analyst")
            admin_label = _label("admin")

            conn.execute(text("ALTER TABLE users ADD COLUMN role userrole"))

            if "role_id" in columns:
                conn.execute(
                    text(
                        f"""
                        UPDATE users
                        SET role = CASE role_id
                            WHEN 1 THEN '{admin_sql}'::userrole
                            WHEN 2 THEN '{analyst_sql}'::userrole
                            ELSE '{viewer_sql}'::userrole
                        END
                        WHERE role IS NULL
                        """
                    )
                )

            conn.execute(
                text(f"UPDATE users SET role = '{viewer_sql}'::userrole WHERE role IS NULL"),
            )
            conn.execute(
                text(f"ALTER TABLE users ALTER COLUMN role SET DEFAULT '{viewer_sql}'::userrole"),
            )

        if "is_active" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))

        conn.execute(text("UPDATE users SET is_active = TRUE WHERE is_active IS NULL"))

    # Convert legacy plaintext passwords to bcrypt hashes.
    with SessionLocal() as session:
        rows = session.execute(text("SELECT id, hashed_password FROM users")).all()
        for user_id, raw_password in rows:
            if not raw_password:
                continue
            if _is_bcrypt_hash(raw_password):
                continue
            session.execute(
                text("UPDATE users SET hashed_password = :hp WHERE id = :uid"),
                {"hp": pwd_context.hash(raw_password), "uid": user_id},
            )
        session.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
