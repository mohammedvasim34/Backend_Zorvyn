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


class TrendRow(BaseModel):
    month: dt_date
    total_income: float
    total_expense: float


class CategoryBreakdownRow(BaseModel):
    category: str
    total_amount: float


class TrendComparison(BaseModel):
    current_month_expense: float
    previous_month_expense: float
    change_amount: float
    change_percentage: float


class DashboardInsights(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    savings_percentage: float
    trend_comparison: TrendComparison
    anomalies: list[RecordOut]
