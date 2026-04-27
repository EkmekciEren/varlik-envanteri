from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File as FastAPIFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
import io
import csv
import pandas as pd
from datetime import datetime

from app.database import get_db
from app.models.asset import Asset, AssetType, AssetCategory
from app.models.network import NetworkInterface
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetListResponse, NetworkInterfaceCreate
)
from app.auth.dependencies import get_current_user, require_role

router = APIRouter(prefix="/assets", tags=["Assets"])


def _asset_query(db: Session):
    return db.query(Asset).options(
        joinedload(Asset.asset_type),
        joinedload(Asset.network_interfaces),
        joinedload(Asset.files),
    ).filter(Asset.is_deleted == 0)


@router.get("", response_model=AssetListResponse)
def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    asset_type_id: Optional[int] = None,
    vendor: Optional[str] = None,
    location: Optional[str] = None,
    criticality: Optional[str] = None,
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Asset).filter(Asset.is_deleted == 0)

    if search:
        query = query.filter(
            or_(
                Asset.name.ilike(f"%{search}%"),
                Asset.serial_number.ilike(f"%{search}%"),
                Asset.description.ilike(f"%{search}%"),
                Asset.asset_owner.ilike(f"%{search}%"),
            )
        )
    if asset_type_id:
        query = query.filter(Asset.asset_type_id == asset_type_id)
    if vendor:
        query = query.filter(Asset.vendor.ilike(f"%{vendor}%"))
    if location:
        query = query.filter(Asset.location.ilike(f"%{location}%"))
    if criticality:
        query = query.filter(Asset.criticality == criticality)
    if risk_level:
        query = query.filter(Asset.risk_level == risk_level)
    if category:
        query = query.join(AssetType).filter(AssetType.category == category)

    total = query.count()
    pages = (total + page_size - 1) // page_size

    assets = query.options(
        joinedload(Asset.asset_type),
        joinedload(Asset.network_interfaces),
        joinedload(Asset.files),
    ).order_by(Asset.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return AssetListResponse(
        items=[AssetResponse.model_validate(a) for a in assets],
        total=total, page=page, page_size=page_size, pages=pages
    )


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = _asset_query(db).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Varlık bulunamadı")
    return asset


@router.post("", response_model=AssetResponse, status_code=201)
def create_asset(
    data: AssetCreate, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.admin, UserRole.security_analyst, UserRole.network_engineer)
    )
):
    asset = Asset(
        **data.model_dump(exclude={"network_interfaces"}),
        created_by=current_user.id
    )
    db.add(asset)
    db.flush()

    for ni in (data.network_interfaces or []):
        db.add(NetworkInterface(asset_id=asset.id, **ni.model_dump()))

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="CREATE", entity_type="asset", entity_id=asset.id,
        details={"asset_name": asset.name},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(asset)

    return _asset_query(db).filter(Asset.id == asset.id).first()


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int, data: AssetUpdate, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.admin, UserRole.security_analyst, UserRole.network_engineer)
    )
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_deleted == 0).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Varlık bulunamadı")

    # Optimistic locking check
    if asset.version != data.version:
        raise HTTPException(
            status_code=409,
            detail="Bu varlık başka bir kullanıcı tarafından güncellenmiştir. Lütfen sayfayı yenileyiniz."
        )

    update_data = data.model_dump(exclude_unset=True, exclude={"network_interfaces", "version"})
    for key, value in update_data.items():
        setattr(asset, key, value)

    asset.version += 1

    # Update network interfaces if provided
    if data.network_interfaces is not None:
        db.query(NetworkInterface).filter(NetworkInterface.asset_id == asset_id).delete()
        for ni in data.network_interfaces:
            db.add(NetworkInterface(asset_id=asset_id, **ni.model_dump()))

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="UPDATE", entity_type="asset", entity_id=asset.id,
        details={"updated_fields": list(update_data.keys())},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(asset)

    return _asset_query(db).filter(Asset.id == asset.id).first()


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_deleted == 0).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Varlık bulunamadı")

    asset.is_deleted = 1

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="DELETE", entity_type="asset", entity_id=asset.id,
        details={"asset_name": asset.name},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    return {"message": "Varlık başarıyla silindi"}


@router.post("/import-csv")
async def import_csv(
    file: UploadFile = FastAPIFile(...),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.admin))
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Sadece CSV dosyaları kabul edilmektedir")

    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))

    imported = 0
    errors = []
    for i, row in enumerate(reader, 1):
        try:
            asset_type = db.query(AssetType).filter(AssetType.name == row.get('asset_type', '')).first()
            if not asset_type:
                errors.append(f"Satır {i}: Varlık türü bulunamadı: {row.get('asset_type', '')}")
                continue

            asset = Asset(
                name=row.get('name', ''),
                asset_type_id=asset_type.id,
                serial_number=row.get('serial_number', ''),
                description=row.get('description', ''),
                operating_system=row.get('operating_system', ''),
                firmware_version=row.get('firmware_version', ''),
                asset_owner=row.get('asset_owner', ''),
                responsible_team=row.get('responsible_team', ''),
                criticality=row.get('criticality', 'medium'),
                created_by=current_user.id
            )
            db.add(asset)
            imported += 1
        except Exception as e:
            errors.append(f"Satır {i}: {str(e)}")

    db.commit()

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="IMPORT", entity_type="asset",
        details={"imported_count": imported, "error_count": len(errors)},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return {"imported": imported, "errors": errors}


@router.get("/export/excel")
def export_excel(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assets = db.query(Asset).options(
        joinedload(Asset.asset_type),
    ).filter(Asset.is_deleted == 0).all()

    data = []
    for a in assets:
        data.append({
            "ID": a.id,
            "Varlık Adı": a.name,
            "Varlık Türü": a.asset_type.name if a.asset_type else "",
            "Kategori": a.asset_type.category.value if a.asset_type else "",
            "Üretici": a.vendor or "",
            "Seri No": a.serial_number or "",
            "İşletim Sistemi": a.operating_system or "",
            "Firmware": a.firmware_version or "",
            "Lokasyon": a.location or "",
            "Kritiklik": a.criticality.value if a.criticality else "",
            "Risk Seviyesi": a.risk_level.value if a.risk_level else "",
            "Varlık Sahibi": a.asset_owner or "",
            "Sorumlu Ekip": a.responsible_team or "",
            "Oluşturulma": str(a.created_at) if a.created_at else "",
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    df.to_excel(output, index=False, engine='openpyxl', sheet_name='Varlıklar')
    output.seek(0)

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="EXPORT", entity_type="asset",
        details={"exported_count": len(data)},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=varlik_envanteri_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )
