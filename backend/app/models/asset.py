import enum
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Enum,
    ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class AssetCategory(str, enum.Enum):
    IT = "IT"
    OT = "OT"


class CriticalityLevel(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class RiskLevel(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    none = "none"


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    contact = Column(String(300))
    email = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    models = relationship("Model", back_populates="vendor")


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    category = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendor = relationship("Vendor", back_populates="models")


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AssetType(Base):
    __tablename__ = "asset_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    category = Column(Enum(AssetCategory), nullable=False)
    description = Column(Text)
    custom_field_definitions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assets = relationship("Asset", back_populates="asset_type")





class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False, index=True)
    asset_type_id = Column(Integer, ForeignKey("asset_types.id"), nullable=False)
    vendor = Column(String(200))
    model = Column(String(200))
    serial_number = Column(String(200), index=True)
    description = Column(Text)
    location = Column(String(200))

    # System info
    operating_system = Column(String(200))
    firmware_version = Column(String(100))
    software_version = Column(String(100))
    patch_level = Column(String(100))
    protocols = Column(JSON, default=list)  # ["Modbus", "IEC 61850", "DNP3"]

    # Operational info
    asset_owner = Column(String(200))
    responsible_team = Column(String(200))
    criticality = Column(Enum(CriticalityLevel), default=CriticalityLevel.medium)
    commissioned_date = Column(Date)
    warranty_end_date = Column(Date)

    # Security info
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.none)
    open_ports = Column(Text)
    security_notes = Column(Text)

    # Custom fields (JSONB for extensibility)
    custom_fields = Column(JSON, default=dict)

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    version = Column(Integer, default=1)  # Optimistic locking
    is_deleted = Column(Integer, default=0)  # Soft delete

    # Relationships
    asset_type = relationship("AssetType", back_populates="assets")
    network_interfaces = relationship("NetworkInterface", back_populates="asset", cascade="all, delete-orphan")
    files = relationship("File", back_populates="asset", cascade="all, delete-orphan")
