import React, { useState } from 'react';
import { LoginForm as LoginFormType } from '../../types';

interface LoginFormProps {
  onLogin: (credentials: LoginFormType) => Promise<void>;
  loading: boolean;
  error: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, loading, error }) => {
  const [form, setForm] = useState<LoginFormType>({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onLogin(form);
    } catch (err) {
      // Error is handled by the parent component
    }
  };

  const handleChange = (field: keyof LoginFormType) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="login-container">
      <h3>Welcome Back!</h3>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={handleChange('username')}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange('password')}
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <div className="demo-credentials">
        <small>
          <strong>🔥 Demo Credentials (Password: "password"):</strong><br/>
          <strong>Admin:</strong> laurens / password<br/>
          <strong>Managers:</strong><br/>
          • santi / password (San Cristóbal)<br/>
          • leo / password (Medellín)<br/>
          • ivonne / password (Oaxaca City)<br/>
          <strong>Volunteers:</strong><br/>
          • volsc / password (San Cristóbal)<br/>
          • voloax / password (Oaxaca City)<br/>
          • volmed / password (Medellín)
        </small>
      </div>
    </div>
  );
};
