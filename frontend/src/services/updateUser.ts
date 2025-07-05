import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'https://co404-finance-app.onrender.com/api';
export const updateUser = async (id: number, userData: any, token: string) => {
  const res = await axios.put(`${API_BASE}/users/${id}`, userData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};