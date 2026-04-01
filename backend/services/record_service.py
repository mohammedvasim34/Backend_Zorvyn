from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Query, Session

from backend.models.record import Record, RecordType
from backend.models.user import User, UserRole
from backend.schemas.record_schema import CategoryTotal, DashboardSummary, RecordCreate, RecordUpdate
from backend.utils.validators import normalize_category, sanitize_notes


def _apply_record_scope(query: Query, current_user: User) -> Query:
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Record.user_id == current_user.id)
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
    base_query = _apply_record_scope(base_query, current_user)
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
    scoped_query = _apply_record_scope(db.query(Record), current_user)

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
