import { useState, useEffect } from 'react';
import { usersAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineBan } from 'react-icons/hi';

const roleLabels = { admin: 'Yönetici', security_analyst: 'Güvenlik Analisti', network_engineer: 'Network Mühendisi', viewer: 'İzleyici' };

export default function UserManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', role: 'viewer' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = () => {
    usersAPI.list().then(res => setUsers(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: '', email: '', full_name: '', password: '', role: 'viewer' });
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, full_name: u.full_name, password: '', role: u.role });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await usersAPI.update(editUser.id, { email: form.email, full_name: form.full_name, role: form.role });
        toast.success('Kullanıcı güncellendi');
      } else {
        await authAPI.register(form);
        toast.success('Kullanıcı oluşturuldu');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`"${user.full_name}" hesabını devre dışı bırakmak istiyor musunuz?`)) return;
    try {
      await usersAPI.delete(user.id);
      toast.success('Kullanıcı devre dışı bırakıldı');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Hata'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Kullanıcı Yönetimi</h1>
        {isAdmin && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Yeni Kullanıcı</button>}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Kullanıcı Adı</th>
              <th>Ad Soyad</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><span className={`badge badge-${u.role}`}>{roleLabels[u.role] || u.role}</span></td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-low' : 'badge-critical'}`}>
                    {u.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(u)}><HiOutlinePencil /></button>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => handleDeactivate(u)} style={{ color: 'var(--accent-red)' }}><HiOutlineBan /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Kullanıcı Adı</label>
                    <input className="form-input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                {!editUser && (
                  <div className="form-group">
                    <label className="form-label">Şifre</label>
                    <input type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="admin">Yönetici</option>
                    <option value="security_analyst">Güvenlik Analisti</option>
                    <option value="network_engineer">Network Mühendisi</option>
                    <option value="viewer">İzleyici</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn btn-primary">{editUser ? 'Güncelle' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
