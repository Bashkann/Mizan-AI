import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

/**
 * AuthProvider manages authentication state across the app.
 * On mount, it checks the session via GET /api/auth/me.
 * Provides login (Google OAuth redirect), logout, and auth status.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user has an active session on mount
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // 401 or network error means not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect to backend Google OAuth endpoint
  const login = useCallback(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    window.location.href = `${baseURL}/api/auth/google`;
  }, []);

  // Logout by calling backend endpoint and clearing state
  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Even if the request fails, clear local state
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      window.location.href = '/';
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
