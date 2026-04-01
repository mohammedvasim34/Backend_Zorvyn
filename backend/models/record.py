from datetime import date
from enum import Enum

from sqlalchemy import Column, Date, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.database import Base


class RecordType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class Record(Base):
    __tablename__ = "records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(SqlEnum(RecordType), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    date = Column(Date, nullable=False, default=date.today, index=True)
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="records")
