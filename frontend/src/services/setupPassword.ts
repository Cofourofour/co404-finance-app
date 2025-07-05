import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'https://co404-finance-app.onrender.com/api';
export const setupPassword = async (tempToken: string, newPassword: string, confirmPassword: string) => {
  const res = await axios.post(`${API_BASE}/users/setup-password`, {
    tempToken,
    newPassword,
    confirmPassword
  });
  return res.data;
};