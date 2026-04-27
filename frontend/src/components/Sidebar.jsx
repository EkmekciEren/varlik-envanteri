import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineServer, HiOutlineUsers,
  HiOutlineCog, HiOutlineClipboardList, HiOutlineLogout,
  HiOutlineCollection, HiOutlineShieldCheck
} from 'react-icons/hi';

const roleLabels = {
  admin: 'Yönetici',
  security_analyst: 'Güvenlik Analisti',
  network_engineer: 'Network Mühendisi',
  viewer: 'İzleyici',
};

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">VE</div>
        <div>
          <div className="sidebar-title">Varlık Envanteri</div>
          <div className="sidebar-subtitle">OT / IT Asset Manager</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Genel</div>
          <NavLink to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} end>
            <HiOutlineHome /> Dashboard
          </NavLink>
          <NavLink to="/assets" className={`nav-item ${isActive('/assets') ? 'active' : ''}`}>
            <HiOutlineServer /> Varlıklar
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Yönetim</div>
          <NavLink to="/asset-types" className={`nav-item ${isActive('/asset-types') ? 'active' : ''}`}>
            <HiOutlineCollection /> Varlık Türleri
          </NavLink>
          {isAdmin && (
            <NavLink to="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
              <HiOutlineUsers /> Kullanıcılar
            </NavLink>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Güvenlik</div>
          <NavLink to="/audit-log" className={`nav-item ${isActive('/audit-log') ? 'active' : ''}`}>
            <HiOutlineShieldCheck /> Denetim Günlüğü
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <HiOutlineLogout /> Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
