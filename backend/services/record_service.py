from datetime import date

from sqlalchemy import func, text
from sqlalchemy.orm import Query, Session

from backend.models.record import Record, RecordType
from backend.models.user import User, UserRole
from backend.schemas.record_schema import CategoryTotal, DashboardSummary, RecordCreate, RecordUpdate
from backend.utils.validators import normalize_category, sanitize_notes


def _apply_record_scope(query: Query, current_user: User) -> Query:
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.user_id == current_user.id)
    return query


def _apply_record_read_scope(query: Query, current_user: User) -> Query:
    """Read scope for list/analytics pages.

    Analysts and viewers should be able to see all records for analysis/visibility,
    while mutating actions keep stricter ownership/admin checks.
    """
    return query


def _apply_filters(
    query: Query,
    record_type: RecordType | None,
    category: str | None,
    exact_date: date | None,
    start_date: date | None,
    end_date: date | None,
) -> Query:
    if record_type:
        query = query.filter(Record.type == record_type)
    if category:
        query = query.filter(Record.category == normalize_category(category))
    if exact_date:
        query = query.filter(Record.date == exact_date)
    if start_date:
        query = query.filter(Record.date >= start_date)
    if end_date:
        query = query.filter(Record.date <= end_date)
    return query


def create_record(db: Session, payload: RecordCreate, user_id: int) -> Record:
    record = Record(
        user_id=user_id,
        amount=payload.amount,
        type=payload.type,
        category=normalize_category(payload.category),
        date=payload.date,
        notes=sanitize_notes(payload.notes),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_records(
    db: Session,
    current_user: User,
    page: int,
    page_size: int,
    record_type: RecordType | None,
    category: str | None,
    exact_date: date | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[int, list[Record]]:
    base_query = db.query(Record)
    base_query = _apply_record_read_scope(base_query, current_user)
    base_query = _apply_filters(base_query, record_type, category, exact_date, start_date, end_date)

    total = base_query.count()
    items = (
        base_query.order_by(Record.date.desc(), Record.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return total, items


def get_record_or_none(db: Session, record_id: int, current_user: User) -> Record | None:
    query = db.query(Record).filter(Record.id == record_id)
    query = _apply_record_scope(query, current_user)
    return query.first()


def update_record(db: Session, record: Record, payload: RecordUpdate) -> Record:
    update_data = payload.model_dump(exclude_unset=True)

    if "category" in update_data and update_data["category"] is not None:
        update_data["category"] = normalize_category(update_data["category"])
    if "notes" in update_data:
        update_data["notes"] = sanitize_notes(update_data["notes"])

    for key, value in update_data.items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return record


def delete_record(db: Session, record: Record) -> None:
    db.delete(record)
    db.commit()


def get_dashboard_summary(db: Session, current_user: User, recent_limit: int) -> DashboardSummary:
    scoped_query = _apply_record_read_scope(db.query(Record), current_user)

    total_income = (
        scoped_query.filter(Record.type == RecordType.INCOME)
        .with_entities(func.coalesce(func.sum(Record.amount), 0.0))
        .scalar()
    )
    total_expenses = (
        scoped_query.filter(Record.type == RecordType.EXPENSE)
        .with_entities(func.coalesce(func.sum(Record.amount), 0.0))
        .scalar()
    )

    category_rows = (
        scoped_query.with_entities(
            Record.category,
            func.coalesce(func.sum(Record.amount), 0.0).label("total"),
        )
        .group_by(Record.category)
        .order_by(func.sum(Record.amount).desc())
        .all()
    )

    recent_transactions = (
        scoped_query.order_by(Record.date.desc(), Record.id.desc()).limit(recent_limit).all()
    )

    return DashboardSummary(
        total_income=float(total_income or 0),
        total_expenses=float(total_expenses or 0),
        net_balance=float((total_income or 0) - (total_expenses or 0)),
        category_totals=[
            CategoryTotal(category=row.category, total=float(row.total)) for row in category_rows
        ],
        recent_transactions=recent_transactions,
    )


def _analytics_scope_where(current_user: User) -> tuple[str, dict]:
    # Analyst dashboards should aggregate across the full dataset.
    return "", {}


def get_dashboard_trends(db: Session, current_user: User) -> list[dict]:
    scope_where, params = _analytics_scope_where(current_user)
    query = text(
        f"""
        SELECT
            DATE_TRUNC('month', r.date)::date AS month,
            COALESCE(SUM(CASE WHEN r.type = 'income' THEN r.amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN r.type = 'expense' THEN r.amount ELSE 0 END), 0) AS total_expense
        FROM records r
        WHERE 1=1 {scope_where}
        GROUP BY DATE_TRUNC('month', r.date)
        ORDER BY DATE_TRUNC('month', r.date) ASC
        """
    )
    rows = db.execute(query, params).mappings().all()
    return [
        {
            "month": row["month"],
            "total_income": float(row["total_income"] or 0),
            "total_expense": float(row["total_expense"] or 0),
        }
        for row in rows
    ]


def get_dashboard_category_breakdown(db: Session, current_user: User) -> list[dict]:
    scope_where, params = _analytics_scope_where(current_user)
    query = text(
        f"""
        SELECT
            r.category,
            COALESCE(SUM(r.amount), 0) AS total_amount
        FROM records r
        WHERE r.type = 'expense' {scope_where}
        GROUP BY r.category
        ORDER BY total_amount DESC
        """
    )
    rows = db.execute(query, params).mappings().all()
    return [
        {
            "category": row["category"],
            "total_amount": float(row["total_amount"] or 0),
        }
        for row in rows
    ]


def get_dashboard_top_categories(db: Session, current_user: User, limit: int = 5) -> list[dict]:
    scope_where, params = _analytics_scope_where(current_user)
    params["limit"] = limit
    query = text(
        f"""
        SELECT
            r.category,
            COALESCE(SUM(r.amount), 0) AS total_amount
        FROM records r
        WHERE r.type = 'expense' {scope_where}
        GROUP BY r.category
        ORDER BY total_amount DESC
        LIMIT :limit
        """
    )
    rows = db.execute(query, params).mappings().all()
    return [
        {
            "category": row["category"],
            "total_amount": float(row["total_amount"] or 0),
        }
        for row in rows
    ]


def get_dashboard_recent_transactions(db: Session, current_user: User, limit: int = 10) -> list[Record]:
    query = _apply_record_read_scope(db.query(Record), current_user)
    return query.order_by(Record.date.desc(), Record.id.desc()).limit(limit).all()


def get_dashboard_insights(db: Session, current_user: User) -> dict:
    scope_where, params = _analytics_scope_where(current_user)

    totals_query = text(
        f"""
        SELECT
            COALESCE(SUM(CASE WHEN r.type = 'income' THEN r.amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN r.type = 'expense' THEN r.amount ELSE 0 END), 0) AS total_expense
        FROM records r
        WHERE 1=1 {scope_where}
        """
    )
    totals = db.execute(totals_query, params).mappings().first() or {}
    total_income = float(totals.get("total_income") or 0)
    total_expense = float(totals.get("total_expense") or 0)
    net_balance = total_income - total_expense
    savings_percentage = (net_balance / total_income * 100) if total_income > 0 else 0.0

    trend_query = text(
        f"""
        SELECT
            COALESCE(SUM(CASE
                WHEN DATE_TRUNC('month', r.date) = DATE_TRUNC('month', CURRENT_DATE)
                    AND r.type = 'expense'
                THEN r.amount ELSE 0 END), 0) AS current_month_expense,
            COALESCE(SUM(CASE
                WHEN DATE_TRUNC('month', r.date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
                    AND r.type = 'expense'
                THEN r.amount ELSE 0 END), 0) AS previous_month_expense
        FROM records r
        WHERE 1=1 {scope_where}
        """
    )
    trend = db.execute(trend_query, params).mappings().first() or {}
    current_month_expense = float(trend.get("current_month_expense") or 0)
    previous_month_expense = float(trend.get("previous_month_expense") or 0)
    change_amount = current_month_expense - previous_month_expense
    change_percentage = (
        (change_amount / previous_month_expense * 100)
        if previous_month_expense > 0
        else (100.0 if current_month_expense > 0 else 0.0)
    )

    anomaly_params = {**params, "limit": 10}
    anomaly_query = text(
        f"""
        WITH avg_expense AS (
            SELECT COALESCE(AVG(r.amount), 0) AS avg_amount
            FROM records r
            WHERE r.type = 'expense' {scope_where}
        )
        SELECT
            r.id,
            r.user_id,
            r.amount,
            r.type,
            r.category,
            r.date,
            r.notes
        FROM records r, avg_expense ae
        WHERE r.type = 'expense'
          AND r.amount > 2 * ae.avg_amount
          {scope_where}
        ORDER BY r.date DESC, r.id DESC
        LIMIT :limit
        """
    )
    anomaly_rows = db.execute(anomaly_query, anomaly_params).mappings().all()
    anomalies = [
        {
            "id": row["id"],
            "user_id": row["user_id"],
            "amount": float(row["amount"] or 0),
            "type": row["type"],
            "category": row["category"],
            "date": row["date"],
            "notes": row["notes"],
        }
        for row in anomaly_rows
    ]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": net_balance,
        "savings_percentage": savings_percentage,
        "trend_comparison": {
            "current_month_expense": current_month_expense,
            "previous_month_expense": previous_month_expense,
            "change_amount": change_amount,
            "change_percentage": change_percentage,
        },
        "anomalies": anomalies,
    }
