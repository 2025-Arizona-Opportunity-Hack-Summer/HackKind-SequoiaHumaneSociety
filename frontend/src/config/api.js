const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8000',
    timeout: 10000,
  },
  test: {
    baseURL: 'http://localhost:8001',
    timeout: 5000,
  },
  production: {
    baseURL: 'https://hackkind-sequoiahumanesociety.onrender.com',
    timeout: 15000,
  },
};

const environment = process.env.NODE_ENV || 'development';
const env = environment === 'test' ? 'test' : environment === 'production' ? 'production' : 'development';

export const API_BASE_URL = API_CONFIG[env].baseURL;
export const API_TIMEOUT = API_CONFIG[env].timeout;
