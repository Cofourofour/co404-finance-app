import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'https://co404-finance-app.onrender.com/api';
export const deactivateUser = async (id: number, token: string) => {
  const res = await axios.delete(`${API_BASE}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};