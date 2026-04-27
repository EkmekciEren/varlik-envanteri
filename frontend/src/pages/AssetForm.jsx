import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetsAPI, assetTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  HiOutlineServer, HiOutlineGlobe, HiOutlineCog,
  HiOutlineLocationMarker, HiOutlineShieldCheck,
  HiOutlinePlus, HiOutlineTrash, HiOutlineDocumentText
} from 'react-icons/hi';

const PROTOCOLS = ['Modbus TCP', 'Modbus RTU', 'IEC 60870-5-101', 'IEC 60870-5-104', 'IEC 61850', 'DNP3', 'OPC DA', 'OPC UA', 'SNMP', 'SSH', 'HTTP', 'HTTPS', 'MQTT', 'BACnet', 'Profinet'];

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', asset_type_id: '', vendor: '', model: '', serial_number: '',
    description: '', location: '', operating_system: '', firmware_version: '',
    software_version: '', patch_level: '', protocols: [], asset_owner: '',
    responsible_team: '', criticality: 'medium', commissioned_date: '',
    warranty_end_date: '', risk_level: 'none', open_ports: '', security_notes: '',
    custom_fields: {}, network_interfaces: [{ ip_address: '', mac_address: '', hostname: '', vlan: '', network_segment: '', port_info: '' }],
    version: 1
  });

  const [assetTypes, setAssetTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    assetTypesAPI.list().then(t => setAssetTypes(t.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      assetsAPI.get(id).then(res => {
        const a = res.data;
        setForm({
          name: a.name || '', asset_type_id: a.asset_type_id || '', vendor: a.vendor || '',
          model: a.model || '', serial_number: a.serial_number || '', description: a.description || '',
          location: a.location || '', operating_system: a.operating_system || '',
          firmware_version: a.firmware_version || '', software_version: a.software_version || '',
          patch_level: a.patch_level || '', protocols: a.protocols || [], asset_owner: a.asset_owner || '',
          responsible_team: a.responsible_team || '', criticality: a.criticality || 'medium',
          commissioned_date: a.commissioned_date || '', warranty_end_date: a.warranty_end_date || '',
          risk_level: a.risk_level || 'none', open_ports: a.open_ports || '',
          security_notes: a.security_notes || '', custom_fields: a.custom_fields || {},
          network_interfaces: a.network_interfaces?.length > 0 ? a.network_interfaces : [{ ip_address: '', mac_address: '', hostname: '', vlan: '', network_segment: '', port_info: '' }],
          version: a.version || 1
        });
      }).catch(() => navigate('/assets')).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (form.asset_type_id) {
      const t = assetTypes.find(at => at.id === parseInt(form.asset_type_id));
      setSelectedType(t || null);
      if (t && !selectedCategory) {
        setSelectedCategory(t.category);
      }
    }
  }, [form.asset_type_id, assetTypes, selectedCategory]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const updateNI = (index, field, value) => {
    const nis = [...form.network_interfaces];
    nis[index] = { ...nis[index], [field]: value };
    setForm(prev => ({ ...prev, network_interfaces: nis }));
  };

  const addNI = () => setForm(prev => ({
    ...prev, network_interfaces: [...prev.network_interfaces, { ip_address: '', mac_address: '', hostname: '', vlan: '', network_segment: '', port_info: '' }]
  }));

  const removeNI = (index) => setForm(prev => ({
    ...prev, network_interfaces: prev.network_interfaces.filter((_, i) => i !== index)
  }));

  const toggleProtocol = (p) => {
    setForm(prev => ({
      ...prev,
      protocols: prev.protocols.includes(p) ? prev.protocols.filter(x => x !== p) : [...prev.protocols, p]
    }));
  };

  const updateCustomField = (key, value) => {
    setForm(prev => ({ ...prev, custom_fields: { ...prev.custom_fields, [key]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.asset_type_id) {
      toast.error('Varlık adı ve türü zorunludur');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        asset_type_id: parseInt(form.asset_type_id),
        network_interfaces: form.network_interfaces.filter(ni => ni.ip_address || ni.mac_address || ni.hostname),
        commissioned_date: form.commissioned_date || null,
        warranty_end_date: form.warranty_end_date || null,
      };

      if (isEdit) {
        await assetsAPI.update(id, payload);
        toast.success('Varlık güncellendi');
      } else {
        const res = await assetsAPI.create(payload);
        toast.success('Varlık oluşturuldu');
        navigate(`/assets/${res.data.id}`);
        return;
      }
      navigate(`/assets/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };



  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Varlık Düzenle' : 'Yeni Varlık Ekle'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '900px' }}>
        {/* General */}
        <div className="form-section">
          <div className="form-section-title"><HiOutlineServer /> Genel Bilgiler</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Varlık Adı *</label>
              <input className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" 
                  className={`btn ${selectedCategory === 'IT' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
                  onClick={() => { setSelectedCategory('IT'); updateField('asset_type_id', ''); }}>
                  IT Varlıkları
                </button>
                <button type="button" 
                  className={`btn ${selectedCategory === 'OT' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
                  onClick={() => { setSelectedCategory('OT'); updateField('asset_type_id', ''); }}>
                  OT Varlıkları
                </button>
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Varlık Türü *</label>
              <select className="form-select" value={form.asset_type_id} onChange={e => updateField('asset_type_id', e.target.value)} required disabled={!selectedCategory}>
                <option value="">{selectedCategory ? 'Seçiniz' : 'Önce Kategori Seçin'}</option>
                {assetTypes.filter(t => t.category === selectedCategory).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lokasyon</label>
              <input className="form-input" value={form.location} onChange={e => updateField('location', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Üretici</label>
              <input className="form-input" value={form.vendor} onChange={e => updateField('vendor', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-input" value={form.model} onChange={e => updateField('model', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Seri Numarası</label>
              <input className="form-input" value={form.serial_number} onChange={e => updateField('serial_number', e.target.value)} />
            </div>
            <div className="form-group">
              {/* Optional secondary field for layout consistency */}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Açıklama</label>
            <textarea className="form-textarea" value={form.description} onChange={e => updateField('description', e.target.value)} />
          </div>
        </div>

        {/* System Info */}
        <div className="form-section">
          <div className="form-section-title"><HiOutlineCog /> Sistem Bilgileri</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">İşletim Sistemi</label>
              <input className="form-input" value={form.operating_system} onChange={e => updateField('operating_system', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Firmware Versiyonu</label>
              <input className="form-input" value={form.firmware_version} onChange={e => updateField('firmware_version', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Yazılım Versiyonu</label>
              <input className="form-input" value={form.software_version} onChange={e => updateField('software_version', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Patch Seviyesi</label>
              <input className="form-input" value={form.patch_level} onChange={e => updateField('patch_level', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Protokoller</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {PROTOCOLS.map(p => (
                <button key={p} type="button"
                  className={`btn btn-sm ${form.protocols.includes(p) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleProtocol(p)}>{p}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Network Interfaces */}
        <div className="form-section">
          <div className="form-section-title" style={{ justifyContent: 'space-between', display: 'flex' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineGlobe /> Network Arayüzleri</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addNI}><HiOutlinePlus /> Ekle</button>
          </div>
          {form.network_interfaces.map((ni, i) => (
            <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '10px', position: 'relative' }}>
              {form.network_interfaces.length > 1 && (
                <button type="button" style={{ position: 'absolute', top: '8px', right: '8px' }}
                  className="btn btn-secondary btn-sm btn-icon" onClick={() => removeNI(i)}>
                  <HiOutlineTrash />
                </button>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IP Adresi</label>
                  <input className="form-input" value={ni.ip_address} onChange={e => updateNI(i, 'ip_address', e.target.value)} placeholder="10.10.1.1" />
                </div>
                <div className="form-group">
                  <label className="form-label">MAC Adresi</label>
                  <input className="form-input" value={ni.mac_address} onChange={e => updateNI(i, 'mac_address', e.target.value)} placeholder="00:1A:2B:3C:4D:E5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hostname</label>
                  <input className="form-input" value={ni.hostname} onChange={e => updateNI(i, 'hostname', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">VLAN</label>
                  <input className="form-input" value={ni.vlan} onChange={e => updateNI(i, 'vlan', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Network Segment</label>
                  <input className="form-input" value={ni.network_segment} onChange={e => updateNI(i, 'network_segment', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Port Bilgisi</label>
                  <input className="form-input" value={ni.port_info} onChange={e => updateNI(i, 'port_info', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Operational */}
        <div className="form-section">
          <div className="form-section-title"><HiOutlineDocumentText /> Operasyonel Bilgiler</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Varlık Sahibi</label>
              <input className="form-input" value={form.asset_owner} onChange={e => updateField('asset_owner', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Sorumlu Ekip</label>
              <input className="form-input" value={form.responsible_team} onChange={e => updateField('responsible_team', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Kritiklik Seviyesi</label>
              <select className="form-select" value={form.criticality} onChange={e => updateField('criticality', e.target.value)}>
                <option value="critical">Kritik</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Risk Seviyesi</label>
              <select className="form-select" value={form.risk_level} onChange={e => updateField('risk_level', e.target.value)}>
                <option value="critical">Kritik</option>
                <option value="high">Yüksek</option>
                <option value="medium">Orta</option>
                <option value="low">Düşük</option>
                <option value="none">Yok</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Devreye Alma Tarihi</label>
              <input type="date" className="form-input" value={form.commissioned_date} onChange={e => updateField('commissioned_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Garanti Bitiş Tarihi</label>
              <input type="date" className="form-input" value={form.warranty_end_date} onChange={e => updateField('warranty_end_date', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="form-section">
          <div className="form-section-title"><HiOutlineShieldCheck /> Güvenlik Bilgileri</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Açık Portlar</label>
              <input className="form-input" value={form.open_ports} onChange={e => updateField('open_ports', e.target.value)} placeholder="22, 80, 443" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Güvenlik Notları</label>
            <textarea className="form-textarea" value={form.security_notes} onChange={e => updateField('security_notes', e.target.value)} />
          </div>
        </div>

        {/* Custom Fields */}
        {selectedType?.custom_field_definitions?.length > 0 && (
          <div className="form-section">
            <div className="form-section-title">Özel Alanlar ({selectedType.name})</div>
            <div className="form-row">
              {selectedType.custom_field_definitions.map(cf => (
                <div className="form-group" key={cf.name}>
                  <label className="form-label">{cf.label || cf.name}</label>
                  <input className="form-input" value={form.custom_fields[cf.name] || ''}
                    onChange={e => updateCustomField(cf.name, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>İptal</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>
    </div>
  );
}
