# PostgreSQL Migration Guide

## Overview

This project has been successfully migrated from SQLite to PostgreSQL. This guide explains the changes made and how to get started.

## Changes Made

### 1. **Dependencies Updated** (`requirements.txt`)
- Added `psycopg2-binary==2.9.9` - PostgreSQL driver for Python
- Added `python-dotenv==1.0.1` - Environment variable management

### 2. **Database Configuration** (`backend/database.py`)

**Before (SQLite):**
```python
DATABASE_URL = "sqlite:///./finance_dashboard.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
```

**After (PostgreSQL):**
```python
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/finance_dashboard"
)
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
)
```

**Key Changes:**
- Connection string follows PostgreSQL format: `postgresql://user:password@host:port/database`
- Credentials are loaded from environment variables (`.env` file)
- Removed `check_same_thread` (SQLite-specific, not needed for PostgreSQL)
- Added `pool_pre_ping=True` to validate connections before use (production best practice)

### 3. **Environment Variable Management** (`backend/main.py`)

**Added:**
```python
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
```

This allows secure management of database credentials without hardcoding them.

### 4. **Environment Files**

Created two files:

- `.env.example` - Template (should be committed to git)
- `.env` - Local environment variables (should NOT be committed)

### 5. **Models Compatibility**

**Good News:** All existing SQLAlchemy models work unchanged with PostgreSQL!

- `Integer`, `String`, `Date`, `Boolean`, `Float` - All fully compatible
- `Enum` columns work seamlessly with PostgreSQL's native ENUM type
- Foreign key constraints and relationships work identically

The following models require NO changes:
- `backend/models/user.py`
- `backend/models/record.py`

## Setup Instructions

### Prerequisites

1. **Install PostgreSQL** (14+):
   - [Windows](https://www.postgresql.org/download/windows/)
   - [macOS via Homebrew](https://wiki.postgresql.org/wiki/Homebrew)
   - [Linux](https://www.postgresql.org/download/linux/)

### Step-by-Step Setup

#### 1. Create PostgreSQL Database

**Linux/macOS:**
```bash
psql -U postgres
CREATE DATABASE finance_dashboard;
\q
```

**Windows (using psql):**
```bash
psql -U postgres
CREATE DATABASE finance_dashboard;
\q
```

Or use **pgAdmin GUI** to create the database.

#### 2. Clone/Navigate to Project

```bash
cd /workspaces/Backend_Zorvyn/backend
```

#### 3. Create Virtual Environment

```bash
# Linux/macOS
python -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

#### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 5. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# Default setup (if you used defaults):
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/finance_dashboard
# JWT_SECRET_KEY=your-secret-key
```

Edit `.env`:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/finance_dashboard
JWT_SECRET_KEY=your-super-secret-key
```

#### 6. Run the Server

```bash
# From backend directory
uvicorn main:app --reload

# From project root
uvicorn backend.main:app --reload
```

The API will automatically create all tables on startup.

#### 7. Test the API

Open Swagger UI: http://127.0.0.1:8000/docs

#### 8. Test CRUD Operations

**Register a user:**
```bash
curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123"}'
```

**Login:**
```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPass123"
```

**Create a record (with token from login):**
```bash
curl -X POST "http://127.0.0.1:8000/records" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-02",
    "notes": "Monthly salary"
  }'
```

## Migrating Existing Data (SQLite → PostgreSQL)

If you have an existing SQLite database with data:

### Option 1: Manual Re-entry (Simple for small datasets)

1. Note down your existing users and records
2. Start fresh with PostgreSQL
3. Register users via the API
4. Create records via the API

### Option 2: Database Dump & Restore (Advanced)

1. **Export SQLite data:**
```bash
sqlite3 finance_dashboard.db ".dump" > backup.sql
```

2. **Use a migration tool** like:
   - [pgloader](https://pgloader.io/) - Automated PostgreSQL loader
   - [dbeaver](https://dbeaver.io/) - GUI migration tool
   - Custom Python script using SQLAlchemy

3. **Custom Python Migration Script Example:**
```python
from sqlalchemy import create_sqlite_url, engine as sqlite_engine
from backend.database import SessionLocal as PostgresSession
from backend.models import User, Record

# Load from SQLite
sqlite_db = create_engine("sqlite:///./finance_dashboard.db")
# ... migrate data using SQLAlchemy ORM
```

## Troubleshooting

### 1. **Connection Refused Error**
```
Error: could not connect to server: Connection refused
```
**Solution:** Ensure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Linux (systemd)
sudo systemctl start postgresql

# Windows
# Start PostgreSQL via Services or:
pg_ctl -D "C:\Program Files\PostgreSQL\14\data" start
```

### 2. **Database Does Not Exist**
```
Error: database "finance_dashboard" does not exist
```
**Solution:** Create the database:
```bash
createdb -U postgres finance_dashboard
```

### 3. **Authentication Failed**
```
Error: FATAL: password authentication failed for user "postgres"
```
**Solution:** Check `.env` file has correct password, or reset PostgreSQL password:
```bash
psql -U postgres --password
# Enter current password, then ALTER USER command
ALTER USER postgres WITH PASSWORD 'new_password';
```

### 4. **Port Already in Use**
If you need to change the PostgreSQL port, update `.env`:
```
DATABASE_URL=postgresql://postgres:password@localhost:5433/finance_dashboard
```

## Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `finance_dashboard` created
- [ ] Virtual environment activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` file configured with correct credentials
- [ ] API server starts without errors
- [ ] Swagger UI accessible at http://127.0.0.1:8000/docs
- [ ] User registration works
- [ ] Login works with token
- [ ] Records CRUD operations work
- [ ] Dashboard summary endpoint works

## Production Deployment Notes

Before deploying to production:

1. **Change JWT_SECRET_KEY** in `.env` to a strong random key
2. **Use environment variables** for sensitive data (never hardcode)
3. **Set up connection pooling:**
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False
)
```

4. **Enable SSL for database connection:**
```python
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

5. **Backup your PostgreSQL database regularly:**
```bash
pg_dump -U postgres finance_dashboard > backup.sql
```

6. **Monitor database performance** and adjust pool settings as needed

## Files Modified

| File | Changes |
|------|---------|
| `backend/database.py` | Updated to PostgreSQL with environment variables |
| `backend/main.py` | Added dotenv loading |
| `backend/requirements.txt` | Added psycopg2-binary and python-dotenv |
| `backend/README.md` | Updated setup instructions |
| `.env.example` | New: Environment variable template |
| `.env` | New: Local development environment variables |

## No Changes Needed

The following files work unchanged with PostgreSQL:

- `backend/models/user.py`
- `backend/models/record.py`
- `backend/schemas/*`
- `backend/routes/*`
- `backend/services/*`
- `backend/utils/*`

All CRUD operations remain 100% compatible!

## Support & References

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [SQLAlchemy PostgreSQL Dialect](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)
- [psycopg2 Documentation](https://www.psycopg.org/psycopg3/)
- [python-dotenv Docs](https://saurabh-kumar.com/python-dotenv/)
