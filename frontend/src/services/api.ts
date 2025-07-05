import axios from 'axios';
import { User, LoginForm } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://co404-finance-app.onrender.com/api';

export const apiService = {
  login: async (credentials: LoginForm): Promise<{ token: string; user: User }> => {
    const response = await axios.post(`${API_BASE_URL}/login`, credentials);
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('co404_token');
    if (!token) throw new Error('No token');
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
