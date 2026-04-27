import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import AssetForm from './pages/AssetForm';
import UserManagement from './pages/UserManagement';
import AssetTypeManagement from './pages/AssetTypeManagement';
import AuditLog from './pages/AuditLog';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-container"><div className="spinner"></div></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets" element={
        <ProtectedRoute>
          <AppLayout><AssetList /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets/new" element={
        <ProtectedRoute>
          <AppLayout><AssetForm /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets/:id" element={
        <ProtectedRoute>
          <AppLayout><AssetDetail /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/assets/:id/edit" element={
        <ProtectedRoute>
          <AppLayout><AssetForm /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <AppLayout><UserManagement /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/asset-types" element={
        <ProtectedRoute>
          <AppLayout><AssetTypeManagement /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/audit-log" element={
        <ProtectedRoute>
          <AppLayout><AuditLog /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          hideProgressBar={false}
          newestOnTop
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
