# Varlık Envanteri Yönetim Sistemi

Elektrik dağıtım şirketi IT ve OT (SCADA/ICS) altyapısı için kurumsal seviyede **Varlık Envanteri Yönetim Yazılımı**.

## 🚀 Hızlı Başlangıç

### Docker ile (Önerilen)

```bash
# Projeyi çalıştır
docker-compose up --build -d

# Seed verilerini yükle
docker exec -it asset-backend python -m app.seed

# Tarayıcıda aç
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Geliştirme Ortamı (Manuel)

#### Veritabanı
```bash
# PostgreSQL 15 gereklidir
createdb asset_inventory
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
# .env dosyasını oluştur (bkz: ../.env.example)
uvicorn app.main:app --reload --port 8000
python -m app.seed  # Örnek veriler
```

#### Frontend
```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## 🔑 Varsayılan Kullanıcılar

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `admin` | `Admin123!` | Yönetici |
| `security_analyst` | `Analyst123!` | Güvenlik Analisti |
| `network_engineer` | `Engineer123!` | Network Mühendisi |
| `viewer` | `Viewer123!` | İzleyici |

## 🏗️ Mimari

```
├── backend/           # Python FastAPI REST API
│   ├── app/
│   │   ├── models/    # SQLAlchemy ORM modelleri
│   │   ├── schemas/   # Pydantic validasyon
│   │   ├── routers/   # API endpoint'leri
│   │   ├── auth/      # JWT + RBAC
│   │   ├── main.py    # FastAPI uygulama
│   │   ├── seed.py    # Örnek veri
│   │   └── config.py  # Ayarlar
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # React 18 + Vite SPA
│   ├── src/
│   │   ├── pages/     # Dashboard, AssetList, AssetDetail, AssetForm...
│   │   ├── components/# Sidebar
│   │   ├── services/  # Axios API client
│   │   └── context/   # Auth context
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

## 📋 Özellikler

### Varlık Yönetimi
- **IT varlıkları**: Sunucu, VM, Router, Switch, Firewall, AP, Storage
- **OT varlıkları**: SCADA Server, HMI, RTU, PLC, Protection Relay, Bay Controller, IED, Substation Gateway, Historian, Engineering Workstation, Industrial Switch/Firewall, Protocol Gateway, Remote IO
- **Genişletilebilir**: Yeni cihaz türleri ve özel alanlar tanımlanabilir
- Network arayüzleri (IP, MAC, VLAN, Segment)
- Dosya ekleme (fotoğraf, diyagram, konfigürasyon, doküman)
- Protokol desteği (Modbus, IEC 61850, DNP3, OPC UA vb.)

### Dashboard
- Toplam varlık sayısı, IT/OT dağılımı
- Üretici, tür, kritiklik dağılımı grafikleri
- Son eklenen varlıklar

### Güvenlik
- JWT authentication
- Rol bazlı erişim kontrolü (RBAC)
- Denetim günlüğü (Audit Log)
- Optimistic locking (eşzamanlı kullanım koruması)

### Veri İşlemleri
- CSV içe aktarma
- Excel dışa aktarma
- RESTful API ile entegrasyon

## 🔧 Teknolojiler

| Bileşen | Teknoloji |
|---------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Frontend | React 18, Vite, Recharts, React Router |
| Veritabanı | PostgreSQL 15 |
| Auth | JWT (python-jose), bcrypt |
| Container | Docker, docker-compose |
| Web Sunucu | Nginx (production) |

## 📡 API Dökümantasyonu

Backend çalıştırıldığında otomatik OpenAPI dökümantasyonu:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Temel Endpoint'ler

```
POST   /api/auth/login          # JWT giriş
GET    /api/dashboard/stats     # Dashboard istatistikleri
GET    /api/assets              # Varlık listesi (filtreleme, sayfalama)
POST   /api/assets              # Varlık oluştur
GET    /api/assets/{id}         # Varlık detay
PUT    /api/assets/{id}         # Varlık güncelle
DELETE /api/assets/{id}         # Varlık sil (soft delete)
POST   /api/assets/import-csv   # CSV içe aktar
GET    /api/assets/export/excel # Excel dışa aktar
GET    /api/asset-types         # Varlık türleri
POST   /api/files/assets/{id}   # Dosya yükle
GET    /api/audit-logs          # Denetim günlüğü
```

## 📊 Veritabanı Şeması

Temel tablolar: `users`, `asset_types`, `vendors`, `models`, `locations`, `assets`, `network_interfaces`, `files`, `audit_logs`

- `assets.custom_fields` (JSONB): Genişletilebilir özel alanlar
- `assets.protocols` (JSONB): Protokol listesi
- `assets.version`: Optimistic locking
- `asset_types.custom_field_definitions` (JSONB): Tür bazlı özel alan tanımları
"# varlik-envanteri2" 
