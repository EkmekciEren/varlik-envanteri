from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class NetworkInterface(Base):
    __tablename__ = "network_interfaces"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    ip_address = Column(String(45))  # IPv6 support
    mac_address = Column(String(17))
    hostname = Column(String(255))
    vlan = Column(String(50))
    network_segment = Column(String(200))
    port_info = Column(String(200))

    asset = relationship("Asset", back_populates="network_interfaces")
