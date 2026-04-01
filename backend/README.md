# Finance Dashboard Backend

A clean, modular FastAPI backend for a Finance Dashboard application.

## Tech Stack

- FastAPI
- SQLite
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

1. Create and activate a virtual environment:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. (Optional but recommended) Set JWT secret key:

```powershell
$env:JWT_SECRET_KEY="your-super-secret-key"
```

4. Start the API server:

```powershell
uvicorn backend.main:app --reload
```

5. Open Swagger UI:

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

- SQLite file (`finance_dashboard.db`) is created automatically on first run.
- First registered user is promoted to `admin` for bootstrap.
- Subsequent registrations default to `viewer` for safety.
- Use admin endpoints to promote users to `analyst` or `admin`.
