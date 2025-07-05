import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, loading, error, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'manager') navigate('/manager');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="login-page-container">
      <h2>Login</h2>
      <LoginForm onLogin={login} loading={loading} error={error} />
    </div>
  );
};

export default LoginPage;
