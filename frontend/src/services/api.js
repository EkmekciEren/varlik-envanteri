import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  register: (data) => api.post('/auth/register', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Assets
export const assetsAPI = {
  list: (params) => api.get('/assets', { params }),
  get: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assets/import-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  exportExcel: () => api.get('/assets/export/excel', { responseType: 'blob' }),
};

// Asset Types
export const assetTypesAPI = {
  list: () => api.get('/asset-types'),
  get: (id) => api.get(`/asset-types/${id}`),
  create: (data) => api.post('/asset-types', data),
  update: (id, data) => api.put(`/asset-types/${id}`, data),
  delete: (id) => api.delete(`/asset-types/${id}`),
};



// Files
export const filesAPI = {
  upload: (assetId, file, fileType) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/files/assets/${assetId}?file_type=${fileType}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: (assetId) => api.get(`/files/assets/${assetId}`),
  download: (fileId) => api.get(`/files/${fileId}/download`, { responseType: 'blob' }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
};

// Dashboard
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

// Users
export const usersAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Audit Logs
export const auditAPI = {
  list: (params) => api.get('/audit-logs', { params }),
};

export default api;
