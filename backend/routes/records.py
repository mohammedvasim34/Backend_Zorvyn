from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.models.record import RecordType
from backend.database import get_db
from backend.models.user import User, UserRole
from backend.schemas.record_schema import RecordCreate, RecordListResponse, RecordOut, RecordUpdate
from backend.services.record_service import (
    create_record,
    delete_record,
    get_record_or_none,
    get_records,
    update_record,
)
from backend.utils.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/records", tags=["Records"])


@router.post("", response_model=RecordOut, status_code=status.HTTP_201_CREATED)
def create_financial_record(
    payload: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.VIEWER)),
):
    return create_record(db=db, payload=payload, user_id=current_user.id)


@router.get("", response_model=RecordListResponse)
def list_financial_records(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    type: RecordType | None = Query(default=None),
    category: str | None = Query(default=None),
    date: date | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total, records = get_records(
        db=db,
        current_user=current_user,
        page=page,
        page_size=page_size,
        record_type=type,
        category=category,
        exact_date=date,
        start_date=start_date,
        end_date=end_date,
    )
    return RecordListResponse(page=page, page_size=page_size, total=total, items=records)


@router.put("/{record_id}", response_model=RecordOut)
def update_financial_record(
    record_id: int,
    payload: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    record = get_record_or_none(db=db, record_id=record_id, current_user=current_user)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    return update_record(db=db, record=record, payload=payload)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_financial_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.VIEWER)),
):
    record = get_record_or_none(db=db, record_id=record_id, current_user=current_user)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    delete_record(db=db, record=record)
    return None
