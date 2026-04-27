from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, ChangePassword
)
from app.auth.jwt import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız devre dışı bırakılmıştır"
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})

    # Audit log
    audit = AuditLog(
        user_id=user.id, username=user.username,
        action="LOGIN", entity_type="user", entity_id=user.id,
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return Token(
        access_token=token,
        user=UserResponse.model_validate(user)
    )


@router.post("/register", response_model=UserResponse)
def register(
    data: UserCreate, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    existing = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Kullanıcı adı veya e-posta zaten kayıtlı")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="CREATE", entity_type="user", entity_id=user.id,
        details={"created_user": user.username},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    return user


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/change-password")
def change_password(
    data: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Şifre başarıyla güncellendi"}
