import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assetsAPI, filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlineDownload,
  HiOutlineUpload, HiOutlineArrowLeft, HiOutlineServer,
  HiOutlineGlobe, HiOutlineCog, HiOutlineLocationMarker,
  HiOutlineShieldCheck, HiOutlineDocumentText, HiOutlinePhotograph
} from 'react-icons/hi';

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, isAdmin } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadType, setUploadType] = useState('photo');

  useEffect(() => { fetchAsset(); }, [id]);

  const fetchAsset = () => {
    assetsAPI.get(id)
      .then(res => setAsset(res.data))
      .catch(() => { toast.error('Varlık bulunamadı'); navigate('/assets'); })
      .finally(() => setLoading(false));
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${asset.name}" varlığını silmek istediğinizden emin misiniz?`)) return;
    try {
      await assetsAPI.delete(id);
      toast.success('Varlık silindi');
      navigate('/assets');
    } catch { toast.error('Silme başarısız'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await filesAPI.upload(id, file, uploadType);
      toast.success('Dosya yüklendi');
      fetchAsset();
    } catch { toast.error('Dosya yüklenemedi'); }
    e.target.value = '';
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const res = await filesAPI.download(fileId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('İndirme başarısız'); }
  };

  const handleFileDelete = async (fileId) => {
    if (!window.confirm('Dosyayı silmek istiyor musunuz?')) return;
    try {
      await filesAPI.delete(fileId);
      toast.success('Dosya silindi');
      fetchAsset();
    } catch { toast.error('Dosya silinemedi'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!asset) return null;

  const Row = ({ label, value }) => value ? (
    <div className="detail-row">
      <span className="detail-key">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  ) : null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/assets" className="btn btn-secondary btn-sm btn-icon"><HiOutlineArrowLeft /></Link>
          <div>
            <h1>{asset.name}</h1>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span className={`badge badge-${asset.asset_type?.category?.toLowerCase()}`}>{asset.asset_type?.category}</span>
              <span className={`badge badge-${asset.criticality}`}>{asset.criticality}</span>
              <span className={`badge badge-${asset.risk_level}`}>Risk: {asset.risk_level}</span>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          {canEdit && <Link to={`/assets/${id}/edit`} className="btn btn-primary"><HiOutlinePencil /> Düzenle</Link>}
          {isAdmin && <button className="btn btn-danger" onClick={handleDelete}><HiOutlineTrash /> Sil</button>}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          {/* General Info */}
          <div className="detail-section">
            <h3><HiOutlineServer /> Genel Bilgiler</h3>
            <Row label="Varlık Adı" value={asset.name} />
            <Row label="Varlık Türü" value={asset.asset_type?.name} />
            <Row label="Kategori" value={asset.asset_type?.category} />
            <Row label="Üretici" value={asset.vendor} />
            <Row label="Model" value={asset.model} />
            <Row label="Seri Numarası" value={asset.serial_number} />
            <Row label="Açıklama" value={asset.description} />
          </div>

          {/* System Info */}
          <div className="detail-section">
            <h3><HiOutlineCog /> Sistem Bilgileri</h3>
            <Row label="İşletim Sistemi" value={asset.operating_system} />
            <Row label="Firmware" value={asset.firmware_version} />
            <Row label="Yazılım Versiyonu" value={asset.software_version} />
            <Row label="Patch Seviyesi" value={asset.patch_level} />
            <Row label="Protokoller" value={asset.protocols?.join(', ')} />
          </div>

          {/* Network Interfaces */}
          <div className="detail-section">
            <h3><HiOutlineGlobe /> Network Bilgileri</h3>
            {asset.network_interfaces?.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>IP Adresi</th>
                    <th>MAC</th>
                    <th>Hostname</th>
                    <th>VLAN</th>
                    <th>Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.network_interfaces.map(ni => (
                    <tr key={ni.id}>
                      <td style={{ fontFamily: 'monospace', color: '#60a5fa' }}>{ni.ip_address || '-'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{ni.mac_address || '-'}</td>
                      <td>{ni.hostname || '-'}</td>
                      <td>{ni.vlan || '-'}</td>
                      <td>{ni.network_segment || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Network bilgisi girilmemiş</p>}
          </div>

          {/* Security */}
          <div className="detail-section">
            <h3><HiOutlineShieldCheck /> Güvenlik Bilgileri</h3>
            <Row label="Risk Seviyesi" value={asset.risk_level} />
            <Row label="Açık Portlar" value={asset.open_ports} />
            <Row label="Güvenlik Notları" value={asset.security_notes} />
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Location */}
          <div className="detail-section">
            <h3><HiOutlineLocationMarker /> Fiziksel Bilgiler</h3>
            <Row label="Lokasyon" value={asset.location} />
          </div>

          {/* Operational */}
          <div className="detail-section">
            <h3><HiOutlineDocumentText /> Operasyonel Bilgiler</h3>
            <Row label="Varlık Sahibi" value={asset.asset_owner} />
            <Row label="Sorumlu Ekip" value={asset.responsible_team} />
            <Row label="Kritiklik" value={asset.criticality} />
            <Row label="Devreye Alma" value={asset.commissioned_date} />
            <Row label="Garanti Bitiş" value={asset.warranty_end_date} />
          </div>

          {/* Custom fields */}
          {asset.custom_fields && Object.keys(asset.custom_fields).length > 0 && (
            <div className="detail-section">
              <h3>Özel Alanlar</h3>
              {Object.entries(asset.custom_fields).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </div>
          )}

          {/* Files */}
          <div className="detail-section">
            <h3><HiOutlinePhotograph /> Dosyalar</h3>
            {canEdit && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                <select className="form-select" style={{ width: 'auto' }} value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}>
                  <option value="photo">Fotoğraf</option>
                  <option value="diagram">Diyagram</option>
                  <option value="config">Konfigürasyon</option>
                  <option value="document">Doküman</option>
                  <option value="other">Diğer</option>
                </select>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <HiOutlineUpload /> Yükle
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            )}
            <div className="file-list">
              {asset.files?.length > 0 ? asset.files.map(f => (
                <div key={f.id} className="file-item">
                  <div className="file-item-info">
                    <span className={`badge badge-${f.file_type === 'photo' ? 'it' : 'ot'}`}>{f.file_type}</span>
                    <div>
                      <div className="file-item-name">{f.file_name}</div>
                      <div className="file-item-meta">{f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleFileDownload(f.id, f.file_name)}>
                      <HiOutlineDownload />
                    </button>
                    {canEdit && (
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleFileDelete(f.id)}
                        style={{ color: 'var(--accent-red)' }}>
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Dosya eklenmemiş</p>}
            </div>
          </div>

          {/* Metadata */}
          <div className="detail-section">
            <h3>Metadata</h3>
            <Row label="ID" value={asset.id} />
            <Row label="Oluşturulma" value={asset.created_at ? new Date(asset.created_at).toLocaleString('tr-TR') : '-'} />
            <Row label="Güncelleme" value={asset.updated_at ? new Date(asset.updated_at).toLocaleString('tr-TR') : '-'} />
            <Row label="Versiyon" value={asset.version} />
          </div>
        </div>
      </div>
    </div>
  );
}
