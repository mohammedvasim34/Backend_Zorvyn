from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User, UserRole
from backend.schemas.user_schema import Token, UserCreate, UserOut
from backend.services.auth_service import authenticate_user, create_access_token, create_user
from backend.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    # Bootstrap rule: first registered user becomes admin; others default to viewer.
    existing_users = db.query(User).count()
    role = UserRole.ADMIN if existing_users == 0 else UserRole.VIEWER
    user = create_user(db=db, email=payload.email, password=payload.password, role=role)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db=db, identifier=form_data.username, password=form_data.password)
    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
