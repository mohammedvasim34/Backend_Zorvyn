from pydantic import BaseModel, ConfigDict, EmailStr, Field

from backend.models.user import UserRole


class UserCreate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.VIEWER


class UserOut(BaseModel):
    id: int
    name: str | None = None
    email: EmailStr
    role: UserRole
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserStatusUpdate(BaseModel):
    is_active: bool
