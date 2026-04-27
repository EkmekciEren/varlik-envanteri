"""
Seed script: Populates the database with initial data.
Run: python -m app.seed
"""
from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.asset import AssetType, AssetCategory, Asset, CriticalityLevel, RiskLevel
from app.models.network import NetworkInterface
from app.auth.jwt import get_password_hash
from datetime import date

# Drop and recreate all tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:


        print("Veritabanı seed işlemi başlıyor...")

        # ============ USERS ============
        admin = User(
            username="admin", email="admin@kcetas.com.tr",
            hashed_password=get_password_hash("Admin123!"),
            full_name="Sistem Yöneticisi", role=UserRole.admin
        )
        analyst = User(
            username="security_analyst", email="security@kcetas.com.tr",
            hashed_password=get_password_hash("Analyst123!"),
            full_name="Güvenlik Analisti", role=UserRole.security_analyst
        )
        engineer = User(
            username="network_engineer", email="network@kcetas.com.tr",
            hashed_password=get_password_hash("Engineer123!"),
            full_name="Network Mühendisi", role=UserRole.network_engineer
        )
        viewer = User(
            username="viewer", email="viewer@kcetas.com.tr",
            hashed_password=get_password_hash("Viewer123!"),
            full_name="İzleyici Kullanıcı", role=UserRole.viewer
        )
        db.add_all([admin, analyst, engineer, viewer])
        db.flush()
        print("✓ Kullanıcılar oluşturuldu")

        # ============ ASSET TYPES ============
        it_types = [
            AssetType(name="Sunucu", category=AssetCategory.IT, description="Fiziksel veya sanal sunucu"),
            AssetType(name="Sanal Makine", category=AssetCategory.IT, description="Sanallaştırma platformunda çalışan VM"),
            AssetType(name="Router", category=AssetCategory.IT, description="Yönlendirici cihaz"),
            AssetType(name="Switch", category=AssetCategory.IT, description="Ağ anahtarı"),
            AssetType(name="Firewall", category=AssetCategory.IT, description="Güvenlik duvarı"),
            AssetType(name="Access Point", category=AssetCategory.IT, description="Kablosuz erişim noktası"),
            AssetType(name="Storage", category=AssetCategory.IT, description="Depolama sistemi"),
        ]
        ot_types = [
            AssetType(name="SCADA Server", category=AssetCategory.OT, description="SCADA sunucusu"),
            AssetType(name="HMI", category=AssetCategory.OT, description="İnsan-Makine Arayüzü"),
            AssetType(name="RTU", category=AssetCategory.OT, description="Remote Terminal Unit"),
            AssetType(name="PLC", category=AssetCategory.OT, description="Programlanabilir Mantık Denetleyicisi"),
            AssetType(name="Protection Relay", category=AssetCategory.OT, description="Koruma rölesi"),
            AssetType(name="Bay Controller", category=AssetCategory.OT, description="Fider kontrolörü"),
            AssetType(name="IED", category=AssetCategory.OT, description="Intelligent Electronic Device"),
            AssetType(name="Substation Gateway", category=AssetCategory.OT, description="Trafo merkezi ağ geçidi"),
            AssetType(name="Historian Server", category=AssetCategory.OT, description="Endüstriyel veri arşiv sunucusu"),
            AssetType(name="Engineering Workstation", category=AssetCategory.OT, description="Mühendislik iş istasyonu"),
            AssetType(name="Industrial Switch", category=AssetCategory.OT, description="Endüstriyel ağ anahtarı"),
            AssetType(name="Industrial Firewall", category=AssetCategory.OT, description="Endüstriyel güvenlik duvarı"),
            AssetType(name="Protocol Gateway", category=AssetCategory.OT, description="Protokol dönüştürücü"),
            AssetType(name="Remote IO", category=AssetCategory.OT, description="Uzaktan giriş/çıkış modülü"),
        ]
        all_types = it_types + ot_types
        db.add_all(all_types)
        db.flush()
        print("✓ Varlık türleri oluşturuldu")



        # ============ ASSETS ============
        assets_data = [
            # OT Assets
            Asset(
                name="Merkez SCADA Sunucu 1", asset_type_id=ot_types[0].id,
                vendor="Siemens", model="WinCC OA",
                serial_number="SCA-2024-001", location="Merkez SCADA Kontrol Odası",
                description="Ana SCADA sunucusu - WinCC OA", operating_system="Windows Server 2019",
                firmware_version="N/A", software_version="WinCC OA V3.18",
                protocols=["IEC 60870-5-104", "IEC 61850", "Modbus TCP"],
                asset_owner="SCADA Ekibi", responsible_team="OT Güvenlik",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.high,
                commissioned_date=date(2022, 3, 15), warranty_end_date=date(2027, 3, 15),
                security_notes="Kritik altyapı, 7/24 izlenmektedir", created_by=admin.id
            ),
            Asset(
                name="Kayseri TM RTU", asset_type_id=ot_types[2].id,
                vendor="Siemens", model="SICAM A8000",
                serial_number="RTU-KYS-001", location="Kayseri TM",
                description="Kayseri Trafo Merkezi RTU", operating_system="Embedded Linux",
                firmware_version="V08.30.01", protocols=["IEC 60870-5-104", "IEC 61850", "Modbus RTU"],
                asset_owner="Saha Ekibi", responsible_team="OT Güvenlik",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.medium,
                commissioned_date=date(2021, 6, 10), warranty_end_date=date(2026, 6, 10),
                created_by=admin.id
            ),
            Asset(
                name="Kayseri TM Koruma Rölesi - Fider 1", asset_type_id=ot_types[4].id,
                vendor="Siemens", model="SIPROTEC 5",
                serial_number="REL-KYS-001", location="Kayseri TM",
                description="7SA87 mesafe koruma rölesi", firmware_version="V09.30",
                protocols=["IEC 61850", "IEC 60870-5-103"],
                asset_owner="Koruma Ekibi", responsible_team="OT Güvenlik",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.medium,
                commissioned_date=date(2020, 9, 1), warranty_end_date=date(2025, 9, 1),
                created_by=admin.id
            ),
            Asset(
                name="Develi TM RTU", asset_type_id=ot_types[2].id,
                vendor="ABB", model="RTU560",
                serial_number="RTU-DVL-001", location="Develi TM",
                description="ABB RTU560", operating_system="VxWorks",
                firmware_version="V12.4.2", protocols=["IEC 60870-5-101", "IEC 60870-5-104"],
                asset_owner="Saha Ekibi", responsible_team="OT Güvenlik",
                criticality=CriticalityLevel.high, risk_level=RiskLevel.medium,
                commissioned_date=date(2019, 4, 20), warranty_end_date=date(2024, 4, 20),
                created_by=admin.id
            ),
            Asset(
                name="Develi TM Fider Rölesi", asset_type_id=ot_types[4].id,
                vendor="ABB", model="REF615",
                serial_number="REL-DVL-001", location="Develi TM",
                description="ABB REF615 fider koruma rölesi",
                firmware_version="V5.0", protocols=["IEC 61850"],
                criticality=CriticalityLevel.high, risk_level=RiskLevel.low,
                created_by=admin.id
            ),
            Asset(
                name="Merkez HMI İstasyonu 1", asset_type_id=ot_types[1].id,
                vendor="Siemens", serial_number="HMI-MRK-001",
                location="Merkez SCADA Kontrol Odası", description="SCADA operatör HMI istasyonu",
                operating_system="Windows 10 LTSC", software_version="WinCC OA V3.18 Client",
                asset_owner="SCADA Ekibi", responsible_team="OT Güvenlik",
                criticality=CriticalityLevel.high, risk_level=RiskLevel.medium,
                created_by=admin.id
            ),
            Asset(
                name="Merkez Historian Sunucu", asset_type_id=ot_types[8].id,
                vendor="GE Digital", serial_number="HIS-MRK-001",
                location="Merkez SCADA Kontrol Odası", description="GE Historian veri arşiv sunucusu",
                operating_system="Windows Server 2019", software_version="Historian 7.2",
                protocols=["OPC DA", "OPC UA"],
                criticality=CriticalityLevel.high, risk_level=RiskLevel.medium,
                created_by=admin.id
            ),
            Asset(
                name="Kayseri TM Endüstriyel Switch", asset_type_id=ot_types[10].id,
                vendor="Moxa", model="EDS-516A",
                serial_number="ISW-KYS-001", location="Kayseri TM",
                description="Moxa endüstriyel Ethernet switch",
                firmware_version="V3.10", protocols=["Ethernet"],
                criticality=CriticalityLevel.high, risk_level=RiskLevel.low,
                created_by=admin.id
            ),
            Asset(
                name="Merkez Mühendislik İstasyonu", asset_type_id=ot_types[9].id,
                vendor="Dell", serial_number="ENG-MRK-001",
                location="Merkez SCADA Kontrol Odası", description="SCADA mühendislik iş istasyonu",
                operating_system="Windows 10 Pro",
                criticality=CriticalityLevel.medium, risk_level=RiskLevel.high,
                security_notes="Mühendislik yazılımları yüklü, USB port kontrolü gerekli",
                created_by=admin.id
            ),
            Asset(
                name="Bünyan TM RTU", asset_type_id=ot_types[2].id,
                vendor="Schneider Electric", model="Easergy T300",
                serial_number="RTU-BNY-001", location="Bünyan TM",
                description="Schneider Easergy T300", firmware_version="V4.2",
                protocols=["IEC 60870-5-104", "DNP3"],
                criticality=CriticalityLevel.high, risk_level=RiskLevel.medium,
                created_by=admin.id
            ),
            # IT Assets
            Asset(
                name="DC Sunucu 01", asset_type_id=it_types[0].id,
                vendor="Dell", model="PowerEdge R750",
                serial_number="SRV-DC-001", location="Veri Merkezi",
                description="Active Directory Domain Controller",
                operating_system="Windows Server 2022", patch_level="2024-02",
                asset_owner="IT Altyapı", responsible_team="IT Operasyon",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.low,
                commissioned_date=date(2023, 1, 15), warranty_end_date=date(2028, 1, 15),
                created_by=admin.id
            ),
            Asset(
                name="Core Switch 01", asset_type_id=it_types[3].id,
                vendor="Cisco", model="Catalyst 9300",
                serial_number="SW-CORE-001", location="Veri Merkezi",
                description="Cisco Catalyst 9300 Core Switch",
                operating_system="IOS-XE", firmware_version="17.9.4",
                asset_owner="Network Ekibi", responsible_team="IT Operasyon",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.low,
                open_ports="22, 443", created_by=admin.id
            ),
            Asset(
                name="WAN Router 01", asset_type_id=it_types[2].id,
                vendor="Cisco", model="ISR 4331",
                serial_number="RTR-WAN-001", location="Veri Merkezi",
                description="Cisco ISR 4331 WAN Router",
                firmware_version="17.6.5", protocols=["BGP", "OSPF"],
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.medium,
                created_by=admin.id
            ),
            Asset(
                name="Perimeter Firewall", asset_type_id=it_types[4].id,
                vendor="Fortinet", model="FortiGate 100F",
                serial_number="FW-PRM-001", location="Veri Merkezi",
                description="FortiGate 100F Perimeter Firewall",
                firmware_version="7.4.2", open_ports="443, 8443",
                asset_owner="Güvenlik Ekibi", responsible_team="IT Güvenlik",
                criticality=CriticalityLevel.critical, risk_level=RiskLevel.low,
                created_by=admin.id
            ),
            Asset(
                name="ESXi Host 01 (VM)", asset_type_id=it_types[1].id,
                vendor="Dell", serial_number="VM-ESX-001",
                location="Veri Merkezi", description="VMware ESXi Sanallaştırma Host",
                operating_system="ESXi 8.0 U2", patch_level="2024-01",
                criticality=CriticalityLevel.high, risk_level=RiskLevel.low,
                created_by=admin.id
            ),
        ]
        db.add_all(assets_data)
        db.flush()
        print(f"✓ {len(assets_data)} varlık oluşturuldu")

        # ============ NETWORK INTERFACES ============
        nis = [
            NetworkInterface(asset_id=assets_data[0].id, ip_address="10.10.1.10", hostname="scada-srv-01", vlan="100", network_segment="SCADA Zone"),
            NetworkInterface(asset_id=assets_data[0].id, ip_address="172.16.1.10", hostname="scada-srv-01-mgmt", vlan="200", network_segment="Management"),
            NetworkInterface(asset_id=assets_data[1].id, ip_address="10.20.1.1", hostname="rtu-kys-01", vlan="110", network_segment="Substation LAN"),
            NetworkInterface(asset_id=assets_data[2].id, ip_address="10.20.1.10", hostname="rel-kys-fdr1", vlan="110", network_segment="Substation LAN"),
            NetworkInterface(asset_id=assets_data[3].id, ip_address="10.30.1.1", hostname="rtu-dvl-01", vlan="120", network_segment="Substation LAN"),
            NetworkInterface(asset_id=assets_data[5].id, ip_address="10.10.1.20", hostname="hmi-01", vlan="100", network_segment="SCADA Zone", mac_address="00:1A:2B:3C:4D:01"),
            NetworkInterface(asset_id=assets_data[10].id, ip_address="192.168.1.10", hostname="dc01", vlan="10", network_segment="Server Farm", mac_address="00:50:56:A1:B2:01"),
            NetworkInterface(asset_id=assets_data[11].id, ip_address="192.168.1.1", hostname="core-sw-01", vlan="1", network_segment="Core", mac_address="00:1A:2B:3C:4D:E0"),
            NetworkInterface(asset_id=assets_data[13].id, ip_address="192.168.0.1", hostname="fw-perimeter", vlan="1", network_segment="DMZ", mac_address="00:09:0F:A1:B2:01"),
        ]
        db.add_all(nis)
        print("✓ Network interface bilgileri eklendi")

        db.commit()
        print("\n✅ Seed işlemi tamamlandı!")
        print("\nVarsayılan kullanıcılar:")
        print("  admin / Admin123!  (Yönetici)")
        print("  security_analyst / Analyst123!  (Güvenlik Analisti)")
        print("  network_engineer / Engineer123!  (Network Mühendisi)")
        print("  viewer / Viewer123!  (İzleyici)")

    except Exception as e:
        db.rollback()
        print(f"Hata: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
