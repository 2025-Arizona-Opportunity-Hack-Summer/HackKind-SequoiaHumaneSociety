import api from './api';

// Token management
let accessToken = null;
let tokenExpiry = null;
let refreshTimeout = null;

/**
 * Handle API errors consistently
 */
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

/**
 * Set the access token and schedule a refresh
 */
const setAuthToken = (token, expiresAt) => {
  accessToken = token;
  tokenExpiry = new Date(expiresAt);
  
  // Clear any existing refresh timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  // Schedule token refresh 1 minute before expiry
  const now = new Date();
  const expiresInMs = tokenExpiry - now - 60000; // 1 minute before expiry
  
  if (expiresInMs > 0) {
    refreshTimeout = setTimeout(() => {
      refreshToken().catch(() => {
        // If refresh fails, clear the token
        clearAuth();
      });
    }, expiresInMs);
  }
};

/**
 * Clear authentication state
 */
const clearAuth = () => {
  accessToken = null;
  tokenExpiry = null;
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

/**
 * Refresh the access token using the refresh token
 */
const refreshToken = async () => {
  try {
    // The refresh token is automatically sent via httpOnly cookie
    const response = await api.post('/auth/refresh');
    const { access_token, expires_at } = response.data;
    
    // Update the token in memory and schedule next refresh
    setAuthToken(access_token, expires_at);
    
    return true;
  } catch (error) {
    clearAuth();
    throw new Error('Session expired. Please log in again.');
  }
};

/**
 * Get the current access token, refreshing if necessary
 */
const getAccessToken = async () => {
  // If we don't have a token or it's expired or about to expire soon (in the next 5 minutes)
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  if (!accessToken || (tokenExpiry && new Date(tokenExpiry) <= fiveMinutesFromNow)) {
    await refreshToken();
  }
  return accessToken;
};

export const authService = {
  /**
   * Log in with email and password
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { access_token, expires_at, user } = response.data;
      
      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Store the access token in memory
      setAuthToken(access_token, expires_at);
      
      // Store user data in session storage for persistence
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Return user data
      return { user };
    } catch (error) {
      console.error('Login error:', error);
      throw handleApiError(error, 'Login failed. Please check your credentials and try again.');
    }
  },

  /**
   * Register a new user
   */
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Registration failed. Please try again.');
    }
  },

  /**
   * Log out the current user
   */
  logout: async () => {
    try {
      // Clear the refresh token on the server
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with client-side cleanup even if server logout fails
    } finally {
      // Clear auth state and session storage
      clearAuth();
      sessionStorage.removeItem('user');
    }
  },
  
  /**
   * Get the current user's data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // If unauthorized, clear auth state
        clearAuth();
      }
      throw handleApiError(error, 'Failed to fetch user data');
    }
  },
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated: async () => {
    try {
      // Check if we have a user in session storage
      const user = sessionStorage.getItem('user');
      if (!user) return false;
      
      // Check if we have a valid access token or can refresh it
      try {
        await getAccessToken();
        return true;
      } catch (error) {
        // If we can't get a valid token, we're not authenticated
        console.debug('Token validation failed:', error);
        return false;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      // Clear session if there's an error
      sessionStorage.removeItem('user');
      return false;
    }
  },
  
  /**
   * Check if the current user has a specific role
   */
  hasRole: async (role) => {
    try {
      const user = await authService.getCurrentUser();
      return user?.role === role;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Check if the current user is an admin (case-insensitive check)
   */
  isAdmin: async () => {
    try {
      const user = await authService.getCurrentUser();
      return user?.role?.toLowerCase() === 'admin';
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },
  
  /**
   * Get the current access token
   */
  getAccessToken: async () => {
    return getAccessToken();
  }
};