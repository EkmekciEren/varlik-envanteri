from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime, date
from app.models.asset import AssetCategory, CriticalityLevel, RiskLevel


# --- Asset Type ---
class AssetTypeBase(BaseModel):
    name: str
    category: AssetCategory
    description: Optional[str] = None
    custom_field_definitions: Optional[List[dict]] = []


class AssetTypeCreate(AssetTypeBase):
    pass


class AssetTypeUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[AssetCategory] = None
    description: Optional[str] = None
    custom_field_definitions: Optional[List[dict]] = None


class AssetTypeResponse(AssetTypeBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True




# --- Network Interface ---
class NetworkInterfaceBase(BaseModel):
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    hostname: Optional[str] = None
    vlan: Optional[str] = None
    network_segment: Optional[str] = None
    port_info: Optional[str] = None


class NetworkInterfaceCreate(NetworkInterfaceBase):
    pass


class NetworkInterfaceResponse(NetworkInterfaceBase):
    id: int

    class Config:
        from_attributes = True


# --- File ---
class FileResponse(BaseModel):
    id: int
    asset_id: int
    file_name: str
    file_type: str
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Asset ---
class AssetBase(BaseModel):
    name: str
    asset_type_id: int
    vendor: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None

    operating_system: Optional[str] = None
    firmware_version: Optional[str] = None
    software_version: Optional[str] = None
    patch_level: Optional[str] = None
    protocols: Optional[List[str]] = []

    asset_owner: Optional[str] = None
    responsible_team: Optional[str] = None
    criticality: Optional[CriticalityLevel] = CriticalityLevel.medium
    commissioned_date: Optional[date] = None
    warranty_end_date: Optional[date] = None

    risk_level: Optional[RiskLevel] = RiskLevel.none
    open_ports: Optional[str] = None
    security_notes: Optional[str] = None

    custom_fields: Optional[dict] = {}


class AssetCreate(AssetBase):
    network_interfaces: Optional[List[NetworkInterfaceCreate]] = []


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type_id: Optional[int] = None
    vendor: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    operating_system: Optional[str] = None
    firmware_version: Optional[str] = None
    software_version: Optional[str] = None
    patch_level: Optional[str] = None
    protocols: Optional[List[str]] = None
    asset_owner: Optional[str] = None
    responsible_team: Optional[str] = None
    criticality: Optional[CriticalityLevel] = None
    commissioned_date: Optional[date] = None
    warranty_end_date: Optional[date] = None
    risk_level: Optional[RiskLevel] = None
    open_ports: Optional[str] = None
    security_notes: Optional[str] = None
    custom_fields: Optional[dict] = None
    network_interfaces: Optional[List[NetworkInterfaceCreate]] = None
    version: int  # Required for optimistic locking


class AssetResponse(AssetBase):
    id: int
    created_by: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    version: int = 1
    is_deleted: int = 0

    asset_type: Optional[AssetTypeResponse] = None
    network_interfaces: Optional[List[NetworkInterfaceResponse]] = []
    files: Optional[List[FileResponse]] = []

    class Config:
        from_attributes = True


class AssetListResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    pages: int


# --- Dashboard ---
class DashboardStats(BaseModel):
    total_assets: int
    it_assets: int
    ot_assets: int
    critical_assets: int
    high_risk_assets: int
    vendor_distribution: List[dict]
    type_distribution: List[dict]
    criticality_distribution: List[dict]
    location_distribution: List[dict]
    recent_assets: List[AssetResponse]


# --- Audit Log ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[Any] = None
    ip_address: Optional[str] = None
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
