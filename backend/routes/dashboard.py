from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User, UserRole
from backend.schemas.record_schema import (
    CategoryBreakdownRow,
    DashboardInsights,
    DashboardSummary,
    RecordOut,
    TrendRow,
)
from backend.services.record_service import (
    get_dashboard_category_breakdown,
    get_dashboard_insights,
    get_dashboard_recent_transactions,
    get_dashboard_summary,
    get_dashboard_top_categories,
    get_dashboard_trends,
)
from backend.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    recent_limit: int = Query(default=5, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_summary(db=db, current_user=current_user, recent_limit=recent_limit)


@router.get("/trends", response_model=list[TrendRow])
def dashboard_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN)),
):
    """Monthly income vs expense using DATE_TRUNC('month', date)."""
    return get_dashboard_trends(db=db, current_user=current_user)


@router.get("/category-breakdown", response_model=list[CategoryBreakdownRow])
def dashboard_category_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN)),
):
    """Expense totals grouped by category."""
    return get_dashboard_category_breakdown(db=db, current_user=current_user)


@router.get("/top-categories", response_model=list[CategoryBreakdownRow])
def dashboard_top_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN)),
):
    """Top 5 expense categories sorted by highest total spending."""
    return get_dashboard_top_categories(db=db, current_user=current_user, limit=5)


@router.get("/recent", response_model=list[RecordOut])
def dashboard_recent(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN)),
):
    """Last 10 transactions sorted by newest date first."""
    return get_dashboard_recent_transactions(db=db, current_user=current_user, limit=10)


@router.get("/insights", response_model=DashboardInsights)
def dashboard_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN)),
):
    """Totals, savings%, month-over-month expense trend, and anomaly detection."""
    return get_dashboard_insights(db=db, current_user=current_user)
