from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.asset import AssetType
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.asset import AssetTypeCreate, AssetTypeUpdate, AssetTypeResponse
from app.auth.dependencies import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/asset-types", tags=["Asset Types"])


@router.get("", response_model=List[AssetTypeResponse])
def list_asset_types(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AssetType).order_by(AssetType.category, AssetType.name).all()


@router.get("/{type_id}", response_model=AssetTypeResponse)
def get_asset_type(type_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    t = db.query(AssetType).filter(AssetType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Varlık türü bulunamadı")
    return t


@router.post("", response_model=AssetTypeResponse, status_code=201)
def create_asset_type(
    data: AssetTypeCreate, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    existing = db.query(AssetType).filter(AssetType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu varlık türü zaten mevcut")
    t = AssetType(**data.model_dump())
    db.add(t)
    db.flush()
    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="CREATE", entity_type="asset_type", entity_id=t.id,
        details={"name": t.name},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(t)
    return t


@router.put("/{type_id}", response_model=AssetTypeResponse)
def update_asset_type(
    type_id: int, data: AssetTypeUpdate, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    t = db.query(AssetType).filter(AssetType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Varlık türü bulunamadı")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/{type_id}")
def delete_asset_type(
    type_id: int, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    t = db.query(AssetType).filter(AssetType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Varlık türü bulunamadı")
    db.delete(t)
    db.commit()
    return {"message": "Varlık türü silindi"}
