from enum import Enum

from sqlalchemy import Boolean, Column, Enum as SqlEnum, Integer, String
from sqlalchemy.orm import relationship

from backend.database import Base


class UserRole(str, Enum):
    VIEWER = "viewer"
    ANALYST = "analyst"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SqlEnum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = Column(Boolean, nullable=False, default=True)

    records = relationship("Record", back_populates="user", cascade="all, delete-orphan")
