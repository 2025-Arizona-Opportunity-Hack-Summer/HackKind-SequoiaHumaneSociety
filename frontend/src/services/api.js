import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { authService } from './authService';

// Ensure consistent API URL formatting
const ensureApiPrefix = (url) => {
  if (url.startsWith('http') || url.startsWith('/api/')) {
    return url;
  }
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: true, // Required for cookies, authorization headers with credentials
  crossDomain: true,
  timeout: 15000, // 15 second timeout
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRF-Token',
});

// Flag to prevent multiple simultaneous token refresh requests
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

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Ensure URL has the correct API prefix
    config.url = ensureApiPrefix(config.url);

    // Define public endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/auth/register',
      '/pets',
      '/pets/'
    ];

    // Check if the current URL matches any public endpoints
    const isPublicEndpoint = publicEndpoints.some(
      endpoint => config.url.endsWith(endpoint) || 
                config.url.includes(`${endpoint}?`) ||
                config.url.includes(`${endpoint}&`)
    );

    // Only add auth header for non-public endpoints
    if (!isPublicEndpoint) {
      try {
        // Get the current access token
        const token = await authService.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        return Promise.reject(error);
      }
    }

    // Add CSRF token for non-GET requests
    if (config.method.toLowerCase() !== 'get' && config.method.toLowerCase() !== 'head') {
      // Skip CSRF for public endpoints and exempted endpoints
      const csrfExemptEndpoints = [
        '/auth/login', 
        '/auth/refresh', 
        '/auth/logout', 
        '/auth/register',
        '/users/me/preferences',
        '/users/me/preferences/'
      ];
      const isCsrfExempt = csrfExemptEndpoints.some(endpoint => 
        config.url.endsWith(endpoint) || 
        config.url.includes(`${endpoint}?`) || 
        config.url.includes(`${endpoint}&`)
      );

      if (!isCsrfExempt) {
        // Get CSRF token from cookies
        const cookies = document.cookie.split(';').reduce((cookies, item) => {
          const [name, value] = item.split('=').map(c => c.trim());
          cookies[name] = value;
          return cookies;
        }, {});
        
        const csrfToken = cookies['csrftoken'];
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
          config.withCredentials = true; // Important for sending cookies
        }
      }
    }

    return config;
  },
  (error) => {
    // Request error handling
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Any status code within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
      // console.error('API Error:', {
      //   message: error.message,
      //   config: error.config,
      //   response: error.response?.data,
      //   status: error.response?.status,
      //   code: error.code,
      // });
    }

    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      return handleNetworkError(error);
    }

    // Handle CORS errors
    if (error.code === 'ERR_CORS') {
      return handleCorsError(error);
    }

    // If we have a response from the server
    if (error.response) {
      // Skip token refresh for public endpoints
      const publicEndpoints = ['/pets', '/pets/'];
      const isPublicEndpoint = publicEndpoints.some(
        endpoint => originalRequest.url.includes(endpoint)
      );
      
      // Handle token expiration (401 Unauthorized) for non-public endpoints
      if (error.response.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
        return handleTokenRefresh(error, originalRequest);
      }

      // Handle CSRF token mismatch (403 Forbidden)
      if (error.response.status === 403 && 
          error.response.data?.detail?.toLowerCase().includes('csrf')) {
        return handleCsrfError(error);
      }

      // Handle other HTTP errors
      return handleHttpError(error);
    }

    // Handle errors without response
    return handleNoResponseError(error);
  }
);

/**
 * Handle network errors (no internet connection)
 */
function handleNetworkError(error) {
  const networkError = new Error('Unable to connect to the server. Please check your internet connection.');
  networkError.isNetworkError = true;
  showErrorToast(networkError.message);
  return Promise.reject(networkError);
}

/**
 * Handle CORS errors
 */
function handleCorsError(error) {
  const corsError = new Error('Cross-origin request blocked. Please ensure the backend server is properly configured for CORS.');
  corsError.isCorsError = true;
  showErrorToast(corsError.message);
  return Promise.reject(corsError);
}

/**
 * Handle token refresh flow
 */
async function handleTokenRefresh(error, originalRequest) {
  // Prevent infinite loops
  originalRequest._retry = true;

  // If we're already refreshing, add to queue
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
    // Try to refresh the token
    const newToken = await authService.refreshToken();
    
    if (newToken) {
      // Update the authorization header
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      
      // Process any queued requests
      processQueue(null, newToken);
      
      // Retry the original request
      return api(originalRequest);
    } else {
      // If refresh fails, log the user out
      await authService.logout();
      redirectToLogin();
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
  } catch (refreshError) {
    // If refresh fails, log the user out
    processQueue(refreshError, null);
    await authService.logout();
    redirectToLogin();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Handle CSRF token errors
 */
function handleCsrfError(error) {
  const csrfError = new Error('Security verification failed. Please refresh the page and try again.');
  csrfError.isCsrfError = true;
  showErrorToast(csrfError.message);
  return Promise.reject(csrfError);
}

/**
 * Handle HTTP errors (4xx, 5xx)
 */
function handleHttpError(error) {
  const { status, data } = error.response;
  let errorMessage = 'An error occurred';
  
  // Customize error message based on status code
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
  
  // Show error toast for client-side errors (4xx) except 401
  if (status >= 400 && status < 500 && status !== 401) {
    showErrorToast(errorMessage);
  }
  
  return Promise.reject(httpError);
}

/**
 * Handle errors with no response from server
 */
function handleNoResponseError(error) {
  let errorMessage = 'An unexpected error occurred';
  
  if (error.request) {
    // Request was made but no response was received
    errorMessage = 'No response from server. Please check your connection.';
  } else {
    // Error in request setup
    errorMessage = `Request setup error: ${error.message}`;
  }
  
  const noResponseError = new Error(errorMessage);
  noResponseError.isNetworkError = true;
  showErrorToast(errorMessage);
  
  return Promise.reject(noResponseError);
}

/**
 * Show error toast message
 */
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

/**
 * Redirect to login page
 */
function redirectToLogin() {
  // Only redirect if not already on the login page
  if (!window.location.pathname.includes('/login')) {
    // Store current URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    window.location.href = '/login';
  }
}

// Utility to ensure CSRF token is set
export async function ensureCsrfToken() {
  const cookies = document.cookie.split(';').reduce((cookies, item) => {
    const [name, value] = item.split('=');
    if (name && value) cookies[name.trim()] = value.trim();
    return cookies;
  }, {});
  if (!cookies['csrftoken']) {
    // Fetch the CSRF token from the backend
    await fetch('/api/auth/csrf/', { credentials: 'include' });
  }
}

export default api;