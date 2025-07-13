import api from './api';

let accessToken = null;
let tokenExpiry = null;
let refreshTimeout = null;

const ACCESS_TOKEN_KEY = 'access_token';
const ACCESS_TOKEN_EXPIRY_KEY = 'access_token_expiry';

const savedToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
const savedExpiry = sessionStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
if (savedToken && savedExpiry) {
  accessToken = savedToken;
  tokenExpiry = new Date(savedExpiry);
}

const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (!error.response) {
    throw new Error('Network error. Please check your connection and try again.');
  }
  
  const { status, data } = error.response;
  let message = defaultMessage;
  
  if (data?.detail) {
    message = typeof data.detail === 'string' 
      ? data.detail 
      : JSON.stringify(data.detail);
  } else if (status === 401) {
    message = 'Your session has expired. Please log in again.';
  } else if (status === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (status === 404) {
    message = 'The requested resource was not found.';
  } else if (status >= 500) {
    message = 'A server error occurred. Please try again later.';
  }
  
  const errorWithMessage = new Error(message);
  errorWithMessage.status = status;
  throw errorWithMessage;
};

const setAuthToken = (token, expiresAt) => {
  accessToken = token;
  tokenExpiry = new Date(expiresAt);
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, tokenExpiry.toISOString());
  
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  const now = new Date();
  const expiresInMs = tokenExpiry - now - 60000;
  
  if (expiresInMs > 0) {
    refreshTimeout = setTimeout(() => {
      refreshToken().catch(() => {
        clearAuth();
      });
    }, expiresInMs);
  }
};

const clearAuth = () => {
  accessToken = null;
  tokenExpiry = null;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh');
    
    const { access_token, expires_at } = response.data;
    
    setAuthToken(access_token, expires_at);
    
    return true;
  } catch (error) {
    clearAuth();
    throw new Error('Session expired. Please log in again.');
  }
};

const getAccessToken = async () => {
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  if (!accessToken || (tokenExpiry && new Date(tokenExpiry) <= fiveMinutesFromNow)) {
    await refreshToken();
  }
  
  return accessToken;
};

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token, expires_at, user } = response.data;
      
      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }
      
      setAuthToken(access_token, expires_at);
      
      sessionStorage.setItem('user', JSON.stringify(user));
      
      return { user };
    } catch (error) {
      console.error('Login error:', error);
      throw handleApiError(error, 'Login failed. Please check your credentials and try again.');
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Registration failed. Please try again.');
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      sessionStorage.removeItem('user');
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        clearAuth();
      }
      throw handleApiError(error, 'Failed to fetch user data');
    }
  },
  
  isAuthenticated: async () => {
    try {
      const user = sessionStorage.getItem('user');
      if (!user) return false;
      
      try {
        await getAccessToken();
        return true;
      } catch (error) {
        console.debug('Token validation failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      sessionStorage.removeItem('user');
      return false;
    }
  },
  
  hasRole: async (role) => {
    try {
      const user = await authService.getCurrentUser();
      return user?.role === role;
    } catch (error) {
      return false;
    }
  },
  
  isAdmin: async () => {
    try {
      const user = await authService.getCurrentUser();
      return user?.role?.toLowerCase() === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  getAccessToken: async () => {
    return getAccessToken();
  }
};