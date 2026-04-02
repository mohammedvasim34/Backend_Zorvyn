# Finance Dashboard Backend

A clean, modular FastAPI backend for a Finance Dashboard application.

## Tech Stack

- FastAPI
- PostgreSQL (with psycopg2 driver)
- SQLAlchemy ORM
- Pydantic validation
- JWT authentication

## Project Structure

```text
backend/
├── main.py
├── database.py
├── models/
│   ├── user.py
│   └── record.py
├── schemas/
│   ├── user_schema.py
│   └── record_schema.py
├── routes/
│   ├── auth.py
│   ├── users.py
│   ├── records.py
│   └── dashboard.py
├── services/
│   ├── auth_service.py
│   └── record_service.py
├── utils/
│   ├── dependencies.py
│   └── validators.py
└── README.md
```

## Setup Instructions

### Prerequisites

1. **PostgreSQL**: Install PostgreSQL 14+ from [postgresql.org](https://www.postgresql.org/download/)

2. **Create Database** (Linux/Mac):
```bash
psql -U postgres
CREATE DATABASE finance_dashboard;
\q
```

Or on **Windows** (using pgAdmin or psql):
```sql
CREATE DATABASE finance_dashboard;
```

### Project Setup

1. Create and activate a virtual environment:

```bash
cd backend
python -m venv .venv

# Linux/Mac
source .venv/bin/activate

# Windows
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. **Configure environment variables** - Copy `.env.example` to `.env` and update as needed:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase PostgreSQL credentials:
```
DATABASE_URL=postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
JWT_SECRET_KEY=your-super-secret-key
```

4. Verify database connection by starting the API server:

```bash
uvicorn main:app --reload
```

If you start from the project root instead of `backend/`, use:

```bash
uvicorn backend.main:app --reload
```

5. The API will automatically create all tables on first run. Open Swagger UI:

- http://127.0.0.1:8000/docs

## Authentication Flow

1. Register a user with `POST /auth/register`
2. Login with `POST /auth/login` (OAuth2 form fields: `username`, `password`)
3. Use returned bearer token in `Authorization: Bearer <token>`

## Role Permissions

- `viewer`: view records + dashboard
- `analyst`: view records + dashboard insights
- `admin`: full access (record CRUD + user management)

## Sample API Requests

### 1) Register

```bash
curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPass123"
  }'
```

### 2) Login

```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=StrongPass123"
```

### 3) Create Record (admin only)

```bash
curl -X POST "http://127.0.0.1:8000/records" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1200,
    "type": "income",
    "category": "Salary",
    "date": "2026-04-01",
    "notes": "Monthly payroll"
  }'
```

### 4) List Records with Filters + Pagination

```bash
curl "http://127.0.0.1:8000/records?page=1&page_size=10&type=income&category=Salary" \
  -H "Authorization: Bearer <token>"
```

### 5) Dashboard Summary

```bash
curl "http://127.0.0.1:8000/dashboard/summary?recent_limit=5" \
  -H "Authorization: Bearer <token>"
```

## Notes

- Supabase PostgreSQL tables are created automatically on first run via `Base.metadata.create_all()`.
- First registered user is promoted to `admin` for bootstrap.
- Subsequent registrations default to `viewer` for safety.
- Use admin endpoints to promote users to `analyst` or `admin`.
- Environment variables are loaded from `.env` file (see `.env.example` for reference).

## Database Troubleshooting

**Connection Error**: Ensure Supabase credentials in `.env` are correct:
```bash
psql "postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

**Pool Connection Issue**: Adjust `pool_size` in `database.py` if needed:
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,  # Add this for production
    max_overflow=20,
    echo=False
)
```
