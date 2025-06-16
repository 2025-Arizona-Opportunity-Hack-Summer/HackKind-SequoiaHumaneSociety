import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

// Create the auth context
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
  hasRole: () => false,
  isAdmin: false,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Initialize auth state on mount
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a token
      const token = authService.getToken();
      if (!token) {
        setUser(null);
        return;
      }

      // If we have a token, verify it and get user data
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If token is invalid, clear it
        if (error.response?.status === 401) {
          await authService.logout();
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await authService.login(credentials);
      
      // Fetch the full user profile
      const userProfile = await authService.getCurrentUser();
      setUser(userProfile);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        setUser(null);
        return null;
      }
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        await logout();
      }
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    hasRole,
    isAdmin,
    initializeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;