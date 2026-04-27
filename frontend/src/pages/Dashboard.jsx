import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  HiOutlineServer, HiOutlineChip, HiOutlineExclamation,
  HiOutlineShieldExclamation, HiOutlineDesktopComputer
} from 'react-icons/hi';

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div><p>Dashboard yükleniyor...</p></div>;
  if (!stats) return <div className="empty-state"><h3>Veri yüklenemedi</h3></div>;

  const itOtData = [
    { name: 'IT Varlıkları', value: stats.it_assets },
    { name: 'OT Varlıkları', value: stats.ot_assets },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="page-header-actions">
          <Link to="/assets/new" className="btn btn-primary">
            + Yeni Varlık Ekle
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon blue"><HiOutlineServer /></div>
          <div className="stat-info">
            <div className="stat-label">Toplam Varlık</div>
            <div className="stat-value">{stats.total_assets}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><HiOutlineDesktopComputer /></div>
          <div className="stat-info">
            <div className="stat-label">IT Varlıkları</div>
            <div className="stat-value">{stats.it_assets}</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><HiOutlineChip /></div>
          <div className="stat-info">
            <div className="stat-label">OT Varlıkları</div>
            <div className="stat-value">{stats.ot_assets}</div>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><HiOutlineExclamation /></div>
          <div className="stat-info">
            <div className="stat-label">Kritik Varlıklar</div>
            <div className="stat-value">{stats.critical_assets}</div>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><HiOutlineShieldExclamation /></div>
          <div className="stat-info">
            <div className="stat-label">Yüksek Riskli</div>
            <div className="stat-value">{stats.high_risk_assets}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>IT / OT Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={itOtData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {itOtData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#151a2e', border: '1px solid #1e2642', borderRadius: '8px', color: '#e8ecf4' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Üretici Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.vendor_distribution} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="#5a6478" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#5a6478" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#151a2e', border: '1px solid #1e2642', borderRadius: '8px', color: '#e8ecf4' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Kritiklik Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.criticality_distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                paddingAngle={4} dataKey="count" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stats.criticality_distribution.map((_, i) => <Cell key={i} fill={COLORS[i + 3]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#151a2e', border: '1px solid #1e2642', borderRadius: '8px', color: '#e8ecf4' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Varlık Türü Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.type_distribution} layout="vertical" margin={{ left: 30 }}>
              <XAxis type="number" stroke="#5a6478" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#5a6478" fontSize={11} width={130} />
              <Tooltip contentStyle={{ background: '#151a2e', border: '1px solid #1e2642', borderRadius: '8px', color: '#e8ecf4' }} />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="card">
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Son Eklenen Varlıklar</h3>
        <table>
          <thead>
            <tr>
              <th>Varlık Adı</th>
              <th>Tür</th>
              <th>Kategori</th>
              <th>Kritiklik</th>
              <th>Oluşturulma</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_assets.map(a => (
              <tr key={a.id}>
                <td><Link to={`/assets/${a.id}`} style={{ color: '#60a5fa', fontWeight: 500 }}>{a.name}</Link></td>
                <td>{a.asset_type?.name || '-'}</td>
                <td><span className={`badge badge-${a.asset_type?.category?.toLowerCase()}`}>{a.asset_type?.category}</span></td>
                <td><span className={`badge badge-${a.criticality}`}>{a.criticality}</span></td>
                <td>{a.created_at ? new Date(a.created_at).toLocaleDateString('tr-TR') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
