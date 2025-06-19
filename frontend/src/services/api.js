import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ensureApiPrefix = (url) => {
  if (url.startsWith('http') || url.startsWith('/api/')) {
    return url;
  }
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    config.url = ensureApiPrefix(config.url);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[API] ${error.response.status} ${error.config.method?.toUpperCase()} ${error.config.url}`,
        {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        }
      );

      if (error.response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('authToken');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;