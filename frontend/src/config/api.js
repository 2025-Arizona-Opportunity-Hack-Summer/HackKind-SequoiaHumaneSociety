const API_CONFIG = {
  development: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    timeout: 10000,
  },
  test: {
    baseURL: 'http://localhost:8001',
    timeout: 5000,
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://hackkind-sequoiahumanesociety.onrender.com',
    timeout: 15000,
  },
};

const environment = process.env.NODE_ENV || 'development';
const env = ['development', 'test', 'production'].includes(environment) ? environment : 'development';

export const API_BASE_URL = API_CONFIG[env].baseURL;
export const API_TIMEOUT = API_CONFIG[env].timeout;
