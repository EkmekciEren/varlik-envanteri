import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { assetsAPI, assetTypesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineDownload, HiOutlineUpload,
  HiOutlineTrash, HiOutlineEye, HiOutlinePencil
} from 'react-icons/hi';

export default function AssetList() {
  const { canEdit, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [assetTypes, setAssetTypes] = useState([]);


  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('asset_type_id') || '';
  const vendorFilter = searchParams.get('vendor_id') || '';
  const criticalityFilter = searchParams.get('criticality') || '';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    assetTypesAPI.list().then(t => setAssetTypes(t.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [page, search, typeFilter, vendorFilter, criticalityFilter, categoryFilter]);

  const fetchAssets = () => {
    setLoading(true);
    const params = { page, page_size: 20 };
    if (search) params.search = search;
    if (typeFilter) params.asset_type_id = typeFilter;
    if (vendorFilter) params.vendor_id = vendorFilter;
    if (criticalityFilter) params.criticality = criticalityFilter;
    if (categoryFilter) params.category = categoryFilter;

    assetsAPI.list(params)
      .then(res => {
        setAssets(res.data.items);
        setTotal(res.data.total);
        setPages(res.data.pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  };

  const handleExport = async () => {
    try {
      const res = await assetsAPI.exportExcel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `varlik_envanteri_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel dışa aktarıldı');
    } catch { toast.error('Dışa aktarma başarısız'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await assetsAPI.importCSV(file);
      toast.success(`${res.data.imported} varlık içe aktarıldı`);
      if (res.data.errors?.length) toast.warn(`${res.data.errors.length} hata oluştu`);
      fetchAssets();
    } catch { toast.error('İçe aktarma başarısız'); }
    e.target.value = '';
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" varlığını silmek istediğinizden emin misiniz?`)) return;
    try {
      await assetsAPI.delete(id);
      toast.success('Varlık silindi');
      fetchAssets();
    } catch { toast.error('Silme başarısız'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Varlık Envanteri <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '14px' }}>({total})</span></h1>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <HiOutlineDownload /> Excel
          </button>
          {isAdmin && (
            <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              <HiOutlineUpload /> CSV İçe Aktar
              <input type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          )}
          {canEdit && (
            <Link to="/assets/new" className="btn btn-primary">
              <HiOutlinePlus /> Yeni Varlık
            </Link>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <div className="search-box">
              <HiOutlineSearch />
              <input
                type="text"
                className="form-input"
                placeholder="Varlık ara..."
                value={search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: 'auto', minWidth: '130px' }}
              value={categoryFilter} onChange={(e) => updateFilter('category', e.target.value)}>
              <option value="">Tüm Kategoriler</option>
              <option value="IT">IT</option>
              <option value="OT">OT</option>
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }}
              value={typeFilter} onChange={(e) => updateFilter('asset_type_id', e.target.value)}>
              <option value="">Tüm Türler</option>
              {assetTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '130px' }}
              value={criticalityFilter} onChange={(e) => updateFilter('criticality', e.target.value)}>
              <option value="">Tüm Kritiklik</option>
              <option value="critical">Kritik</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <HiOutlineSearch style={{ fontSize: '48px' }} />
            <h3>Varlık bulunamadı</h3>
            <p>Filtrelerinizi değiştirin veya yeni bir varlık ekleyin.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Varlık Adı</th>
                <th>Tür</th>
                <th>Kategori</th>
                <th>Üretici</th>
                <th>Lokasyon</th>
                <th>Kritiklik</th>
                <th>Risk</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {assets.map(a => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/assets/${a.id}`} style={{ color: '#60a5fa', fontWeight: 600 }}>
                      {a.name}
                    </Link>
                    {a.serial_number && <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>SN: {a.serial_number}</div>}
                  </td>
                  <td>{a.asset_type?.name || '-'}</td>
                  <td><span className={`badge badge-${a.asset_type?.category?.toLowerCase()}`}>{a.asset_type?.category || '-'}</span></td>
                  <td>{a.vendor || '-'}</td>
                  <td>{a.location || '-'}</td>
                  <td><span className={`badge badge-${a.criticality}`}>{a.criticality}</span></td>
                  <td><span className={`badge badge-${a.risk_level}`}>{a.risk_level}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Link to={`/assets/${a.id}`} className="btn btn-secondary btn-sm btn-icon" title="Detay">
                        <HiOutlineEye />
                      </Link>
                      {canEdit && (
                        <Link to={`/assets/${a.id}/edit`} className="btn btn-secondary btn-sm btn-icon" title="Düzenle">
                          <HiOutlinePencil />
                        </Link>
                      )}
                      {isAdmin && (
                        <button className="btn btn-secondary btn-sm btn-icon" title="Sil"
                          onClick={() => handleDelete(a.id, a.name)}
                          style={{ color: 'var(--accent-red)' }}>
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="table-pagination">
            <span>{total} varlıktan {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} gösteriliyor</span>
            <div className="pagination-btns">
              <button disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))}>‹ Önceki</button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > pages) return null;
                return <button key={p} className={p === page ? 'active' : ''} onClick={() => updateFilter('page', String(p))}>{p}</button>;
              })}
              <button disabled={page >= pages} onClick={() => updateFilter('page', String(page + 1))}>Sonraki ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
