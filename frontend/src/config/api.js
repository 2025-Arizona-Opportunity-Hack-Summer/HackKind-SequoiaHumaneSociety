// API configuration with environment-based settings
const API_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
    timeout: 10000, // 10 seconds
  },
  test: {
    baseURL: 'http://localhost:8001/api', // Test server
    timeout: 5000,
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://your-production-api.com/api',
    timeout: 15000, // 15 seconds
  },
};

// Determine environment
const environment = process.env.NODE_ENV || 'development';
const env = environment === 'test' ? 'test' : environment === 'production' ? 'production' : 'development';

// Export the base URL and other config
export const API_BASE_URL = API_CONFIG[env].baseURL;
export const API_TIMEOUT = API_CONFIG[env].timeout;

// Log the API config in development
if (process.env.NODE_ENV === 'development') {
  console.log(`[API] Environment: ${env}`, {
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
  });
}