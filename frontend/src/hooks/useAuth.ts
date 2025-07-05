// =============================================================================
// CO404 FRONTEND - AUTHENTICATION HOOK (TS)
// =============================================================================
import { useState, useEffect } from 'react';
import { User, LoginForm, UseAuthReturn } from '../types';
import { apiService } from '../services/api';

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('co404_token');
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (): Promise<void> => {
    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('co404_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginForm): Promise<void> => {
    setError('');
    setLoading(true);
    try {
      const response = await apiService.login(credentials);
      localStorage.setItem('co404_token', response.token);
      setUser(response.user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('co404_token');
    setUser(null);
    setError('');
  };

  return {
    user,
    login,
    logout,
    loading,
    error
  };
};
