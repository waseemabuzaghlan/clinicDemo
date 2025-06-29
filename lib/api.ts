import axios from 'axios';
import { getTokenFromCookie } from './auth';

export const getBaseUrl = () => { 
  return process.env.NEXT_PUBLIC_API_BASE_URL;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Automatically attach JWT token if available
api.interceptors.request.use((config) => {
  const token = getTokenFromCookie();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 during login attempts
    if (error.response && error.response.status === 401 && !error.config.url.includes('/auth/login')) {
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;