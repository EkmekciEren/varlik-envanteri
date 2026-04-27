from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.asset import AuditLogResponse, AuditLogListResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username}%"))

    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()

    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(l) for l in logs],
        total=total, page=page, page_size=page_size
    )
