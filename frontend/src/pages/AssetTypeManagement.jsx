import { useState, useEffect } from 'react';
import { assetTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function AssetTypeManagement() {
  const { isAdmin } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'OT', description: '', custom_field_definitions: [] });
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = () => {
    assetTypesAPI.list().then(res => setTypes(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditType(null);
    setForm({ name: '', category: 'OT', description: '', custom_field_definitions: [] });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditType(t);
    setForm({ name: t.name, category: t.category, description: t.description || '', custom_field_definitions: t.custom_field_definitions || [] });
    setShowModal(true);
  };

  const addCustomField = () => {
    if (!newFieldName) return;
    setForm(prev => ({
      ...prev,
      custom_field_definitions: [...prev.custom_field_definitions, { name: newFieldName, label: newFieldLabel || newFieldName, type: 'text' }]
    }));
    setNewFieldName('');
    setNewFieldLabel('');
  };

  const removeCustomField = (idx) => {
    setForm(prev => ({
      ...prev,
      custom_field_definitions: prev.custom_field_definitions.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editType) {
        await assetTypesAPI.update(editType.id, form);
        toast.success('Varlık türü güncellendi');
      } else {
        await assetTypesAPI.create(form);
        toast.success('Varlık türü oluşturuldu');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`"${t.name}" türünü silmek istiyor musunuz?`)) return;
    try {
      await assetTypesAPI.delete(t.id);
      toast.success('Varlık türü silindi');
      fetchTypes();
    } catch (err) { toast.error(err.response?.data?.detail || 'Silinemedi (bağlı varlıklar olabilir)'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  const itTypes = types.filter(t => t.category === 'IT');
  const otTypes = types.filter(t => t.category === 'OT');

  return (
    <div>
      <div className="page-header">
        <h1>Varlık Türleri <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>({types.length})</span></h1>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Yeni Tür</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* IT Types */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            <span className="badge badge-it" style={{ marginRight: '8px' }}>IT</span> IT Varlık Türleri ({itTypes.length})
          </h3>
          {itTypes.map(t => (
            <div key={t.id} className="file-item" style={{ marginBottom: '6px' }}>
              <div>
                <div className="file-item-name">{t.name}</div>
                <div className="file-item-meta">{t.description || 'Açıklama yok'}</div>
                {t.custom_field_definitions?.length > 0 && (
                  <div className="file-item-meta">Özel alanlar: {t.custom_field_definitions.map(f => f.label || f.name).join(', ')}</div>
                )}
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(t)}><HiOutlinePencil /></button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleDelete(t)} style={{ color: 'var(--accent-red)' }}><HiOutlineTrash /></button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* OT Types */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            <span className="badge badge-ot" style={{ marginRight: '8px' }}>OT</span> OT Varlık Türleri ({otTypes.length})
          </h3>
          {otTypes.map(t => (
            <div key={t.id} className="file-item" style={{ marginBottom: '6px' }}>
              <div>
                <div className="file-item-name">{t.name}</div>
                <div className="file-item-meta">{t.description || 'Açıklama yok'}</div>
                {t.custom_field_definitions?.length > 0 && (
                  <div className="file-item-meta">Özel alanlar: {t.custom_field_definitions.map(f => f.label || f.name).join(', ')}</div>
                )}
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(t)}><HiOutlinePencil /></button>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleDelete(t)} style={{ color: 'var(--accent-red)' }}><HiOutlineTrash /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2>{editType ? 'Türü Düzenle' : 'Yeni Varlık Türü'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tür Adı</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Örn: Protocol Gateway" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="IT">IT</option>
                    <option value="OT">OT</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Açıklama</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {/* Custom Fields */}
                <div className="form-group">
                  <label className="form-label">Özel Alanlar</label>
                  {form.custom_field_definitions.map((cf, i) => (
                    <div key={i} className="file-item" style={{ marginBottom: '4px' }}>
                      <div>
                        <span className="file-item-name">{cf.label || cf.name}</span>
                        <span className="file-item-meta" style={{ marginLeft: '8px' }}>({cf.name})</span>
                      </div>
                      <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => removeCustomField(i)}>
                        <HiOutlineTrash />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input className="form-input" placeholder="Alan adı (key)" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} style={{ flex: 1 }} />
                    <input className="form-input" placeholder="Etiket" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomField}><HiOutlinePlus /></button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">{editType ? 'Güncelle' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
