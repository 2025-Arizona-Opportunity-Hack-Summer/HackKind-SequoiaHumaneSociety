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
    console.log('API Error Interceptor:', error);
    
    // If we have a response from the server
    if (error.response) {
      console.log('Error response data:', error.response.data);
      console.log('Error status:', error.response.status);
      
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