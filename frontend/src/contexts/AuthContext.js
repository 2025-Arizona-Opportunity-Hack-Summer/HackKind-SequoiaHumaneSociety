import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

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

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAuthenticated = !!user;
  
  const isAdmin = user?.role === 'admin';

  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a token
      const token = authService.getToken();
      if (!token) {
        console.log('No auth token found');
        setUser(null);
        return;
      }

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Found user in localStorage:', userData);
          setUser(userData);
          return;
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }

      try {
        console.log('Fetching user data from API');
        const userData = await authService.getCurrentUser();
        console.log('Fetched user data:', userData);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (error.response?.status === 401) {
          console.log('Token invalid, logging out');
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

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (!response.user) {
        throw new Error('No user data received');
      }
      
      setUser(response.user);
      
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('User logged in:', response.user);
      return response.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

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