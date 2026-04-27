import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.file import File, FileType
from app.models.asset import Asset
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.asset import FileResponse as FileResponseSchema
from app.auth.dependencies import get_current_user, require_role
from app.config import settings
from typing import List

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/assets/{asset_id}", response_model=FileResponseSchema, status_code=201)
async def upload_file(
    asset_id: int,
    file: UploadFile = FastAPIFile(...),
    file_type: str = "other",
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.admin, UserRole.security_analyst, UserRole.network_engineer)
    )
):
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.is_deleted == 0).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Varlık bulunamadı")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    unique_name = f"{uuid.uuid4()}{ext}"
    asset_dir = os.path.join(settings.UPLOAD_DIR, str(asset_id))
    os.makedirs(asset_dir, exist_ok=True)
    file_path = os.path.join(asset_dir, unique_name)

    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    # Validate file_type
    try:
        ft = FileType(file_type)
    except ValueError:
        ft = FileType.other

    db_file = File(
        asset_id=asset_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=ft,
        file_size=len(content),
        uploaded_by=current_user.id
    )
    db.add(db_file)

    audit = AuditLog(
        user_id=current_user.id, username=current_user.username,
        action="UPLOAD", entity_type="file", entity_id=asset_id,
        details={"file_name": file.filename, "file_type": file_type},
        ip_address=request.client.host if request.client else None
    )
    db.add(audit)
    db.commit()
    db.refresh(db_file)
    return db_file


@router.get("/assets/{asset_id}", response_model=List[FileResponseSchema])
def list_asset_files(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(File).filter(File.asset_id == asset_id).all()


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    f = db.query(File).filter(File.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    if not os.path.exists(f.file_path):
        raise HTTPException(status_code=404, detail="Dosya diskte bulunamadı")
    return FileResponse(
        path=f.file_path,
        filename=f.file_name,
        media_type="application/octet-stream"
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: int, request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.admin, UserRole.security_analyst, UserRole.network_engineer)
    )
):
    f = db.query(File).filter(File.id == file_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    # Remove from disk
    if os.path.exists(f.file_path):
        os.remove(f.file_path)
    db.delete(f)
    db.commit()
    return {"message": "Dosya silindi"}
