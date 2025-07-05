import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h2>Welcome to the Dashboard</h2>
      <div style={{ background: '#fffbe6', color: '#333', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ffe58f', borderRadius: 4 }}>
        <strong>DEBUG USER:</strong>
        <pre style={{ fontSize: '0.8rem', maxHeight: 200, overflow: 'auto' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>
      {user ? (
        <div>
          <p>You are logged in as <b>{user.name}</b> ({user.role}) at <b>{user.location}</b>.</p>
          <p>This is the default dashboard for volunteers or users without a special dashboard.</p>
        </div>
      ) : (
        <div>
          <p>You are not logged in. Please <a href="/login">log in</a>.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
