import enum
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class FileType(str, enum.Enum):
    photo = "photo"
    diagram = "diagram"
    config = "config"
    document = "document"
    other = "other"


class File(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(Enum(FileType), default=FileType.other)
    file_size = Column(BigInteger)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    asset = relationship("Asset", back_populates="files")
