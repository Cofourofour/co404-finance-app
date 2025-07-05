import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'https://co404-finance-app.onrender.com/api';
export const getUsers = async (token: string) => {
  const res = await axios.get(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};