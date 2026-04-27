from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.asset import Asset, AssetType, AssetCategory
from app.models.user import User
from app.schemas.asset import DashboardStats, AssetResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    base = db.query(Asset).filter(Asset.is_deleted == 0)
    total = base.count()

    # IT / OT distribution
    it_count = base.join(AssetType).filter(AssetType.category == AssetCategory.IT).count()
    ot_count = base.join(AssetType).filter(AssetType.category == AssetCategory.OT).count()

    # Critical / high risk
    critical = base.filter(Asset.criticality == "critical").count()
    high_risk = base.filter(Asset.risk_level == "high").count() + base.filter(Asset.risk_level == "critical").count()

    # Vendor distribution
    vendor_dist = db.query(
        Asset.vendor, func.count(Asset.id)
    ).filter(
        Asset.is_deleted == 0, Asset.vendor != None
    ).group_by(Asset.vendor).order_by(func.count(Asset.id).desc()).limit(10).all()

    # Type distribution
    type_dist = db.query(
        AssetType.name, func.count(Asset.id)
    ).join(Asset).filter(
        Asset.is_deleted == 0
    ).group_by(AssetType.name).order_by(func.count(Asset.id).desc()).limit(10).all()

    # Criticality distribution
    crit_dist = db.query(
        Asset.criticality, func.count(Asset.id)
    ).filter(Asset.is_deleted == 0).group_by(
        Asset.criticality
    ).all()

    # Location distribution
    loc_dist = db.query(
        Asset.location, func.count(Asset.id)
    ).filter(
        Asset.is_deleted == 0, Asset.location != None
    ).group_by(Asset.location).order_by(func.count(Asset.id).desc()).limit(10).all()

    # Recent assets
    from sqlalchemy.orm import joinedload
    recent = db.query(Asset).options(
        joinedload(Asset.asset_type),
    ).filter(Asset.is_deleted == 0).order_by(Asset.created_at.desc()).limit(5).all()

    return DashboardStats(
        total_assets=total,
        it_assets=it_count,
        ot_assets=ot_count,
        critical_assets=critical,
        high_risk_assets=high_risk,
        vendor_distribution=[{"name": v[0], "count": v[1]} for v in vendor_dist],
        type_distribution=[{"name": t[0], "count": t[1]} for t in type_dist],
        criticality_distribution=[{"name": c[0].value if c[0] else "N/A", "count": c[1]} for c in crit_dist],
        location_distribution=[{"name": l[0], "count": l[1]} for l in loc_dist],
        recent_assets=[AssetResponse.model_validate(a) for a in recent],
    )
