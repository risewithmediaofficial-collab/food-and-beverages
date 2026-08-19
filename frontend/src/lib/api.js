import axios from 'axios';
import { getAuthToken, getInspectedOrgId, clearAuthSession } from './authSession';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and optional inspected org context
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const inspectedOrgId = getInspectedOrgId();
  if (inspectedOrgId) {
    config.headers['X-Org-ID'] = inspectedOrgId;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // If 401 Unauthorized on protected route, clean stale session
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/superadmin/login') && !url.includes('/public/')) {
      console.warn('[API Auth] Session expired or unauthorized, clearing local tab session.');
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    return Promise.reject(error.response?.data || { message: error.message });
  }
);
