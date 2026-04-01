from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
from backend.routes.auth import router as auth_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.records import router as records_router
from backend.routes.users import router as users_router

# Import models so SQLAlchemy metadata includes all tables.
from backend.models import record, user  # noqa: F401

Base.metadata.create_all(bind=engine)

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


@app.get("/", tags=["Health"])
def root_health_check():
    return {"message": "Finance Dashboard API is running"}


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(records_router)
app.include_router(dashboard_router)
