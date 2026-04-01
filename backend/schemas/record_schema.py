from datetime import date as dt_date

from pydantic import BaseModel, ConfigDict, Field

from backend.models.record import RecordType


class RecordCreate(BaseModel):
    amount: float = Field(gt=0)
    type: RecordType
    category: str = Field(min_length=2, max_length=100)
    date: dt_date
    notes: str | None = Field(default=None, max_length=500)


class RecordUpdate(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    type: RecordType | None = None
    category: str | None = Field(default=None, min_length=2, max_length=100)
    date: dt_date | None = None
    notes: str | None = Field(default=None, max_length=500)


class RecordOut(BaseModel):
    id: int
    user_id: int
    amount: float
    type: RecordType
    category: str
    date: dt_date
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class RecordListResponse(BaseModel):
    page: int
    page_size: int
    total: int
    items: list[RecordOut]


class CategoryTotal(BaseModel):
    category: str
    total: float


class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    category_totals: list[CategoryTotal]
    recent_transactions: list[RecordOut]
