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
    
    // Request interceptor - no logging in production
    
    return config;
  },
  (error) => {
    // Request error
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Response interceptor - no logging in production
    return response;
  },
  (error) => {
    if (error.response) {
      // API error response

      if (error.response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('user');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // No response received from server
    } else {
      // Error in request setup
    }
    return Promise.reject(error);
  }
);

export default api;