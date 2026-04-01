from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .records import router as records_router
from .users import router as users_router

__all__ = ["auth_router", "users_router", "records_router", "dashboard_router"]
