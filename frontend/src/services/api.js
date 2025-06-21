import axios from 'axios';
import { API_BASE_URL } from '../config/api';

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
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Required for cookies, authorization headers with credentials
  crossDomain: true,
  timeout: 10000, // 10 second timeout
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Ensure credentials are included in all requests
api.defaults.withCredentials = true;

// Debugging: Log axios defaults
console.log('Axios defaults:', {
  baseURL: api.defaults.baseURL,
  withCredentials: api.defaults.withCredentials,
  headers: api.defaults.headers
});

api.interceptors.request.use(
  (config) => {
    config.url = ensureApiPrefix(config.url);
    
    // Request interceptor - no logging in production
    
    return config;
  },
  (error) => {
    // Request error with detailed logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Request error:', {
        message: error.message,
        config: error.config,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response',
        request: error.request
      });
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Response interceptor - no logging in production
    return response;
  },
  (error) => {
    console.log('API Error Interceptor:', error);
    
    // Handle network errors (no response from server)
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error:', error.message);
      error.message = 'Unable to connect to the server. Please check your internet connection and try again.';
      return Promise.reject(error);
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_CORS') {
      console.error('CORS Error:', error.message);
      error.message = 'Cross-origin request blocked. Please ensure the backend server is properly configured for CORS.';
      return Promise.reject(error);
    }
    
    // If we have a response from the server
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error status:', error.response.status);
      console.log('Error headers:', error.response.headers);
      
      // Handle CORS preflight issues
      if (error.response.status === 0) {
        error.message = 'Failed to connect to the server. Please check if the backend server is running and accessible.';
      }
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('user');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
      }
      
      // Ensure the error has a consistent structure
      const apiError = new Error(error.response.data?.detail || error.response.data?.message || 'An error occurred');
      apiError.response = {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
      };
      
      // Show toast for client-side errors (4xx) except 401
      if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 401) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : (error.response.data?.detail || error.response.data?.message || 'An error occurred');
        
        // Use toast from window if available, otherwise log to console
        if (typeof window !== 'undefined' && window.toast) {
          window.toast.error(errorMessage, {
            position: 'top-center',
            autoClose: 5000,
          });
        } else {
          console.error('Toast not available. Error:', errorMessage);
        }
      }
      
      return Promise.reject(apiError);
    }
    // No response received from server
    else if (error.request) {
      console.error('No response received:', error.request);
      const noResponseError = new Error('No response from server. Please check your connection.');
      noResponseError.isNetworkError = true;
      
      // Show toast for network errors
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Connection error. Please check your internet connection.', {
          position: 'top-center',
          autoClose: 5000,
        });
      }
      
      return Promise.reject(noResponseError);
    }
    // Error in request setup
    else {
      console.error('Request setup error:', error.message);
      const requestError = new Error('Error setting up request: ' + error.message);
      return Promise.reject(requestError);
    }
  }
);

export default api;