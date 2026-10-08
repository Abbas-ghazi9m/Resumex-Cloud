from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token, security_bearer
from app.models.database_models import User
from app.models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, UserProfileUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user_optional(
    auth_header = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not auth_header or not auth_header.credentials:
        return None
    payload = decode_access_token(auth_header.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()

def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in or provide a valid Bearer token."
        )
    return user

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")
    
    new_user = User(
        email=user_in.email.lower(),
        password_hash=hash_password(user_in.password),
        name=user_in.name,
        preferred_role=user_in.preferred_role or "Full Stack Engineer",
        experience_level=user_in.experience_level or "Mid-Senior"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email.lower()).first()
    if not user or not verify_password(creds.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    updates: UserProfileUpdate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if updates.name is not None:
        current_user.name = updates.name
    if updates.preferred_role is not None:
        current_user.preferred_role = updates.preferred_role
    if updates.experience_level is not None:
        current_user.experience_level = updates.experience_level
    if updates.avatar is not None:
        current_user.avatar = updates.avatar
    
    db.commit()
    db.refresh(current_user)
    return current_user
