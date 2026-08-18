import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and optional org context
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const inspectedOrgId = localStorage.getItem('inspected_org_id');
  if (inspectedOrgId) {
    config.headers['X-Org-ID'] = inspectedOrgId;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Warning:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || { message: error.message });
  }
);
