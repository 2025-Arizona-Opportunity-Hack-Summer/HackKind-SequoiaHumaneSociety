import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
  hasRole: () => false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialize user from session storage if available
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if we have a valid session
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Get the current user data
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } else {
        setUser(null);
      }
      
      return isAuthenticated;
    } catch (error) {
      setError('Failed to initialize authentication');
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Handle login
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { user: userData } = await authService.login(credentials);
      
      if (!userData) {
        throw new Error('No user data received');
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials and try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      setUser(null);
    } catch (error) {
      setError('Failed to logout. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        setUser(null);
        return null;
      }
      
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (error) {
      // Failed to refresh user data
      if (error.response?.status === 401) {
        await logout();
      }
      throw error;
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

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