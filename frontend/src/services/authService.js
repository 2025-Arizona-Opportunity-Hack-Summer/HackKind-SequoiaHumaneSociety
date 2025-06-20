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
  login: async (credentials) => {
    try {
      const loginResponse = await api.post('/auth/login', credentials);
      
      const { user: userData } = loginResponse.data;
      
      if (!userData || !userData.role) {
        console.warn('No user role received in login response');
        userData.role = 'adopter'; 
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('User logged in successfully:', userData);
      return { user: userData };
    } catch (error) {
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
      localStorage.removeItem('user');
      
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn('Logout API call failed, but local session was cleared', error);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('user');
      throw error;
    }
  },
  
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
  
  isAuthenticated: async () => {
    try {
      await api.get('/users/me');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        return false;
      }
      return false;
    }
  }
};