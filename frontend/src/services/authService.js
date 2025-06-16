import api from './api';

// Helper function to handle API errors
const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('[Auth Service]', error);
  
  // Handle network errors
  if (!error.response) {
    throw new Error('Network error. Please check your connection and try again.');
  }
  
  // Handle API errors with response
  const { status, data } = error.response;
  let message = defaultMessage;
  
  if (data && data.detail) {
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

export const authService = {
  /**
   * Logs in a user with the provided credentials
   * @param {Object} credentials - User credentials (email and password)
   * @returns {Promise<Object>} User data and auth token
   */
  login: async (credentials) => {
    try {
      // First, get the auth token
      const loginResponse = await api.post('/auth/login', credentials);
      
      if (!loginResponse.data.access_token) {
        throw new Error('No access token received');
      }
      
      const { access_token, expires_in } = loginResponse.data;
      
      // Store the token in localStorage
      localStorage.setItem('authToken', access_token);
      
      // Store token expiration
      if (expires_in) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
        localStorage.setItem('tokenExpiresAt', expiresAt.toISOString());
      }
      
      // Fetch the user profile
      try {
        const userProfile = await authService.getCurrentUser();
        localStorage.setItem('user', JSON.stringify(userProfile));
        return { ...loginResponse.data, user: userProfile };
      } catch (profileError) {
        console.error('Failed to fetch user profile:', profileError);
        // Even if profile fetch fails, proceed with the login
        return loginResponse.data;
      }
    } catch (error) {
      throw handleApiError(error, 'Login failed. Please check your credentials and try again.');
    }
  },

  /**
   * Registers a new user with the provided data
   * @param {Object} userData - User data (email, password, etc.)
   * @returns {Promise<Object>} User data
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
   * Logs out the current user
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('user');
      
      // Call the logout endpoint if available
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // If the logout API call fails, we still want to clear local data
        console.warn('Logout API call failed, but local session was cleared', error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, we want to clear the local session
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  /**
   * Gets the current user's profile
   * @returns {Promise<Object>} User profile data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'Failed to fetch user profile');
    }
  },
  
  /**
   * Checks if the user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    // Check token expiration if available
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      return new Date(expiresAt) > new Date();
    }
    
    return true; // If no expiration, assume valid
  },
  
  /**
   * Gets the stored auth token
   * @returns {string|null} The auth token or null if not available
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};