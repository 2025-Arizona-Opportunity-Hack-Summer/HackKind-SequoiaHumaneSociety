import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Helper function to ensure URLs start with /api
const ensureApiPrefix = (url) => {
  // Don't modify URLs that are already absolute or already have /api prefix
  if (url.startsWith('http') || url.startsWith('/api/')) {
    return url;
  }
  // Add /api prefix if missing
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
};

// Create axios instance with base URL and headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to add auth token to requests and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    // Ensure the URL has the /api prefix
    config.url = ensureApiPrefix(config.url);
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  (error) => {
    // Log error responses
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error(
        `[API] ${error.response.status} ${error.config.method?.toUpperCase()} ${error.config.url}`,
        {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
        }
      );

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        // Only redirect if not already on the login page
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('authToken');
          // Store the current location to redirect back after login
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('[API] Request setup error:', error.message);
    }

    // Return a rejected promise with the error
    return Promise.reject(error);
  }
);

export default api;