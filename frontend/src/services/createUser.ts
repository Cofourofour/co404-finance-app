import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'https://co404-finance-app.onrender.com/api';
export const createUser = async (userData: any, token: string) => {
  const res = await axios.post(`${API_BASE}/users`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};