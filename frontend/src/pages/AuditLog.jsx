import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { HiOutlineSearch, HiOutlineShieldCheck } from 'react-icons/hi';

const actionLabels = { CREATE: 'Oluştur', UPDATE: 'Güncelle', DELETE: 'Sil', LOGIN: 'Giriş', UPLOAD: 'Yükle', EXPORT: 'Dışa Aktar', IMPORT: 'İçe Aktar' };
const actionColors = { CREATE: '#10b981', UPDATE: '#3b82f6', DELETE: '#ef4444', LOGIN: '#8b5cf6', UPLOAD: '#06b6d4', EXPORT: '#f59e0b', IMPORT: '#f59e0b' };

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => { fetchLogs(); }, [page, actionFilter, entityFilter]);

  const fetchLogs = () => {
    setLoading(true);
    const params = { page, page_size: 50 };
    if (actionFilter) params.action = actionFilter;
    if (entityFilter) params.entity_type = entityFilter;
    auditAPI.list(params)
      .then(res => { setLogs(res.data.items); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const pages = Math.ceil(total / 50);

  return (
    <div>
      <div className="page-header">
        <h1><HiOutlineShieldCheck style={{ marginRight: '8px' }} /> Denetim Günlüğü</h1>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <select className="form-select" style={{ width: 'auto', minWidth: '130px' }} value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">Tüm İşlemler</option>
              <option value="CREATE">Oluştur</option>
              <option value="UPDATE">Güncelle</option>
              <option value="DELETE">Sil</option>
              <option value="LOGIN">Giriş</option>
              <option value="UPLOAD">Yükle</option>
              <option value="EXPORT">Dışa Aktar</option>
              <option value="IMPORT">İçe Aktar</option>
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '130px' }} value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}>
              <option value="">Tüm Varlıklar</option>
              <option value="asset">Varlık</option>
              <option value="user">Kullanıcı</option>
              <option value="asset_type">Varlık Türü</option>
              <option value="file">Dosya</option>
            </select>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{total} kayıt</span>
        </div>

        {loading ? (
          <div className="loading-container" style={{ minHeight: '200px' }}><div className="spinner"></div></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Kullanıcı</th>
                <th>İşlem</th>
                <th>Tür</th>
                <th>Detay</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{l.timestamp ? new Date(l.timestamp).toLocaleString('tr-TR') : '-'}</td>
                  <td style={{ fontWeight: 500 }}>{l.username || '-'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: actionColors[l.action] || '#8892a8', fontWeight: 600, fontSize: '12px' }}>
                      ● {actionLabels[l.action] || l.action}
                    </span>
                  </td>
                  <td>{l.entity_type || '-'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.details ? JSON.stringify(l.details) : '-'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{l.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="table-pagination">
            <span>{total} kayıttan {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} gösteriliyor</span>
            <div className="pagination-btns">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Önceki</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Sonraki ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
