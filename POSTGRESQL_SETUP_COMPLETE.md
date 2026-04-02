# PostgreSQL Setup Complete ✅

Your Finance Dashboard backend has been successfully migrated to PostgreSQL!

## Quick Start

### 1. Install Dependencies (if not done yet)
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the API Server
```bash
cd backend
uvicorn main:app --reload
```

### 3. Access Swagger API Docs
```
http://127.0.0.1:8000/docs
```

## What Was Set Up

- ✅ PostgreSQL 16 installed
- ✅ `finance_dashboard` database created
- ✅ All tables created (`users`, `records`)
- ✅ Environment configured with `.env` file
- ✅ Trust authentication enabled on localhost for local development

## Database Connection

**Connection String:** `postgresql://postgres@127.0.0.1:5432/finance_dashboard`

**Configuration File:** `backend/.env`

```env
DATABASE_URL=postgresql://postgres@127.0.0.1:5432/finance_dashboard
JWT_SECRET_KEY=change-this-in-production
```

## Troubleshooting

### Connection Refused
If you get "connection refused":
```bash
sudo service postgresql status
sudo service postgresql start
```

### Authentication Failed
If you get "authentication failed":
- The setup uses **trust authentication** for local development
- This is configured in `/etc/postgresql/16/main/pg_hba.conf`
- For production, change to password or certificate authentication

### Tables Not Found
Verify tables exist:
```bash
python <<'PYEOF'
from sqlalchemy import text
from backend.database import SessionLocal

with SessionLocal() as db:
    result = db.execute(text('SELECT * FROM pg_tables WHERE schemaname = "public";'))
    tables = [row[0] for row in result]
    print(f"Tables: {tables}")
PYEOF
```

## Next Steps

1. **Register a user** via the API
2. **Create financial records** 
3. **View dashboard** analytics

### Register User
```bash
curl -X POST "http://127.0.0.1:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123"}'
```

### Login
```bash
curl -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=SecurePass123"
```

## Important Notes

- **First registered user** becomes `admin`
- **Subsequent users** default to `viewer`
- Admins can manage users and records
- Use the frontend at `http://localhost:5173` for UI

## Security Notes for Production

⚠️  **Current Setup (Development Only)**
- Trust authentication enabled (no password)
- SQLite migration completed
- All data unencrypted in transit

📋 **For Production Migration**
1. Set strong passwords in PostgreSQL
2. Enable SSL/TLS for database connections
3. Rotate JWT_SECRET_KEY to a secure value
4. Use environment variables for all secrets
5. Setup database backups
6. Configure firewall rules
7. Use connection pooling (PgBouncer)

## Support

See [POSTGRESQL_MIGRATION.md](../POSTGRESQL_MIGRATION.md) for detailed migration information.
