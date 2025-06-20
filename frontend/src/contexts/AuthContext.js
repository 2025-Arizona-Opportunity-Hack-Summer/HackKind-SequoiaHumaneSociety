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
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          try {
            const freshUserData = await authService.getCurrentUser();
            if (freshUserData) {
              setUser(freshUserData);
            }
          } catch (error) {
            // Session invalid, clearing user data
            localStorage.removeItem('user');
            setUser(null);
          }
          return;
        } catch (e) {
          // Error parsing stored user data
        }
      }

      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // Failed to fetch user data
        if (error.response?.status === 401) {
          // Token invalid, logging out
          await authService.logout();
        }
        setUser(null);
      }
    } catch (error) {
      // Auth initialization error
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
      
      return response.user;
    } catch (error) {
      // Login error
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
      // Logout error
      setError('Failed to logout');
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