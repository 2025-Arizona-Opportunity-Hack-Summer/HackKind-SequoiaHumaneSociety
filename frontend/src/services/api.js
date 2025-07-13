import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { authService } from './authService';

const ensureApiPrefix = (url) => {
  if (url.startsWith('http') || url.startsWith('/api/')) {
    return url;
  }
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: true,
  crossDomain: true,
  timeout: 15000,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRF-Token',
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config) => {
    config.url = ensureApiPrefix(config.url);

    const publicEndpoints = [
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/auth/register',
      '/pets',
      '/pets/'
    ];

    const isPublicEndpoint = publicEndpoints.some(
      endpoint => config.url.endsWith(endpoint) || 
                config.url.includes(`${endpoint}?`) ||
                config.url.includes(`${endpoint}&`)
    );

    if (!isPublicEndpoint) {
      try {
        const token = await authService.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }

    if (config.method.toLowerCase() !== 'get' && config.method.toLowerCase() !== 'head') {
      const cookies = document.cookie.split(';').reduce((cookies, item) => {
        const [name, value] = item.split('=');
        if (name && value) cookies[name.trim()] = value.trim();
        return cookies;
      }, {});
      const csrfToken = cookies['csrftoken'];
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
        config.withCredentials = true;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[DEBUG] Setting X-CSRF-Token header:', csrfToken);
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[DEBUG] No csrftoken cookie found when preparing request');
        }
      }
    }

    return config;
  },
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      // console.error('Request error:', {
      //   message: error.message,
      //   config: error.config,
      //   response: error.response ? {
      //     status: error.response.status,
      //     data: error.response.data,
      //     headers: error.response.headers
      //   } : 'No response',
      //   request: error.request
      // });
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (process.env.NODE_ENV !== 'production') {
      // console.error('API Error:', {
      //   message: error.message,
      //   config: error.config,
      //   response: error.response?.data,
      //   status: error.response?.status,
      //   code: error.code,
      // });
    }

    if (error.code === 'ERR_NETWORK') {
      return handleNetworkError(error);
    }

    if (error.code === 'ERR_CORS') {
      return handleCorsError(error);
    }

    if (error.response) {
      const publicEndpoints = ['/pets', '/pets/'];
      const isPublicEndpoint = publicEndpoints.some(
        endpoint => originalRequest.url.includes(endpoint)
      );
      
      if (error.response.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
        return handleTokenRefresh(error, originalRequest);
      }

      if (error.response.status === 403 && 
          error.response.data?.detail?.toLowerCase().includes('csrf')) {
        return handleCsrfError(error);
      }

      return handleHttpError(error);
    }

    return handleNoResponseError(error);
  }
);

function handleNetworkError(error) {
  const networkError = new Error('Unable to connect to the server. Please check your internet connection.');
  networkError.isNetworkError = true;
  showErrorToast(networkError.message);
  return Promise.reject(networkError);
}

function handleCorsError(error) {
  const corsError = new Error('Cross-origin request blocked. Please ensure the backend server is properly configured for CORS.');
  corsError.isCorsError = true;
  showErrorToast(corsError.message);
  return Promise.reject(corsError);
}

async function handleTokenRefresh(error, originalRequest) {
  originalRequest._retry = true;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
    .then(token => {
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return api(originalRequest);
    })
    .catch(err => {
      return Promise.reject(err);
    });
  }

  isRefreshing = true;

  try {
    const newToken = await authService.refreshToken();
    
    if (newToken) {
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
      processQueue(null, newToken);
      
      return api(originalRequest);
    } else {
      await authService.logout();
      redirectToLogin();
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
  } catch (refreshError) {
    processQueue(refreshError, null);
    await authService.logout();
    redirectToLogin();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

function handleCsrfError(error) {
  const csrfError = new Error('Security verification failed. Please refresh the page and try again.');
  csrfError.isCsrfError = true;
  showErrorToast(csrfError.message);
  return Promise.reject(csrfError);
}

function handleHttpError(error) {
  const { status, data } = error.response;
  let errorMessage = 'An error occurred';
  
  switch (status) {
    case 400:
      errorMessage = data?.detail || 'Bad request';
      break;
    case 401:
      errorMessage = 'Your session has expired. Please log in again.';
      authService.logout();
      redirectToLogin();
      break;
    case 403:
      errorMessage = data?.detail || 'You do not have permission to perform this action';
      break;
    case 404:
      errorMessage = 'The requested resource was not found';
      break;
    case 429:
      errorMessage = 'Too many requests. Please try again later.';
      break;
    case 500:
      errorMessage = 'An internal server error occurred. Please try again later.';
      break;
    default:
      errorMessage = data?.detail || `An error occurred (${status})`;
  }
  
  const httpError = new Error(errorMessage);
  httpError.status = status;
  httpError.data = data;
  
  if (status >= 400 && status < 500 && status !== 401) {
    showErrorToast(errorMessage);
  }
  
  return Promise.reject(httpError);
}

function handleNoResponseError(error) {
  let errorMessage = 'An unexpected error occurred';
  
  if (error.request) {
    errorMessage = 'No response from server. Please check your connection.';
  } else {
    errorMessage = `Request setup error: ${error.message}`;
  }
  
  const noResponseError = new Error(errorMessage);
  noResponseError.isNetworkError = true;
  showErrorToast(errorMessage);
  
  return Promise.reject(noResponseError);
}

function showErrorToast(message) {
  if (typeof window !== 'undefined' && window.toast) {
    window.toast.error(message, {
      position: 'top-center',
      autoClose: 5000,
    });
  } else {
    // console.error('Error:', message);
  }
}

function redirectToLogin() {
  if (!window.location.pathname.includes('/login')) {
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
  }
}

export async function ensureCsrfToken() {
  const cookies = document.cookie.split(';').reduce((cookies, item) => {
    const [name, value] = item.split('=');
    if (name && value) cookies[name.trim()] = value.trim();
    return cookies;
  }, {});
  if (!cookies['csrftoken']) {
    await fetch('/api/auth/csrf/', { credentials: 'include' });
  }
}

export default api;