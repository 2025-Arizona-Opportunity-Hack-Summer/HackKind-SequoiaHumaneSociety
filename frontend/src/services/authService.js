import api from './api';

const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('[Auth Service]', error);
  
  if (!error.response) {
    throw new Error('Network error. Please check your connection and try again.');
  }
  
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
      // First, get the auth token and user data
      const loginResponse = await api.post('/auth/login', credentials);
      
      if (!loginResponse.data.access_token) {
        throw new Error('No access token received');
      }
      
      const { access_token, user: userData } = loginResponse.data;
      
      if (!userData || !userData.role) {
        console.warn('No user role received in login response');
        userData.role = 'adopter'; 
      }
      
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      const expiresIn = loginResponse.data.expires_in || 3600; 
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      localStorage.setItem('tokenExpiresAt', expiresAt.toISOString());
      
      console.log('User logged in successfully:', userData);
      return { ...loginResponse.data, user: userData };
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiresAt');
      localStorage.removeItem('user');
      
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed, but local session was cleared', error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      
      const response = await api.get('/users/me');
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      if (error.response?.status === 401) {
        authService.logout();
      }
      throw error;
    }
  },
  
  /**
   * Checks if the user is authenticated
   * @returns {boolean} True if authenticated, false otherwise
   */
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    if (expiresAt) {
      return new Date(expiresAt) > new Date();
    }
    
    return true; 
  },
  
  /**
   * Gets the stored auth token
   * @returns {string|null} The auth token or null if not available
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  }
};