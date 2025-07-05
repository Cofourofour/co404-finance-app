import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/getUsers';
import { createUser } from '../services/createUser';
import { deactivateUser } from '../services/deactivateUser';
import { updateUser } from '../services/updateUser';

const ManagerDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'volunteer', location: '', phoneNumber: '' });
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [editUser, setEditUser] = useState<any | null>(null); // NEW: for editing

  // Get token from localStorage or context
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) setToken(t);
  }, []);

  // Fetch users
  const fetchUsers = () => {
    if (!token) return;
    setLoading(true);
    getUsers(token)
      .then(data => {
        setUsers(data.filter((u: any) => u.role !== 'admin'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [token]);

  // Handle form input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(form, token);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', role: 'volunteer', location: '', phoneNumber: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error creating user');
    }
  };

  // Handle deactivate
  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    await deactivateUser(id, token);
    fetchUsers();
  };

  // Handle edit button click
  const handleEdit = (user: any) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      location: user.location,
      phoneNumber: user.phoneNumber || ''
    });
  };

  // Handle update user
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!editUser) return;
    try {
      await updateUser(editUser.id, form, token);
      setEditUser(null);
      setForm({ firstName: '', lastName: '', email: '', role: 'volunteer', location: '', phoneNumber: '' });
      fetchUsers();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error updating user');
    }
  };

  return (
    <div style={{
      maxWidth: 900,
      margin: '40px auto',
      background: 'rgba(237,232,230,0.85)',
      borderRadius: 24,
      boxShadow: '0 8px 32px rgba(197,140,114,0.15)',
      padding: 32,
      fontFamily: 'Montserrat, Roboto, sans-serif'
    }}>
      <h1 style={{ color: '#B37775', fontWeight: 700, fontSize: 32, marginBottom: 24 }}>Manager Dashboard</h1>
      <button
        style={{
          background: '#C58C72',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: 16,
          marginBottom: 24,
          cursor: 'pointer'
        }}
        onClick={() => { setShowForm(true); setEditUser(null); }}
      >
        + Create Volunteer
      </button>
      {(showForm || editUser) && (
        <form
          onSubmit={editUser ? handleUpdate : handleCreate}
          style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            boxShadow: '0 2px 8px rgba(197,140,114,0.10)'
          }}
        >
          <h2 style={{ color: '#B37775', marginBottom: 16 }}>
            {editUser ? 'Edit User' : 'New Volunteer'}
          </h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #E3DBD6' }} />
            <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #E3DBD6' }} />
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required style={{ flex: 2, padding: 8, borderRadius: 6, border: '1px solid #E3DBD6' }} />
            <input name="phoneNumber" placeholder="Phone (optional)" value={form.phoneNumber} onChange={handleChange} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #E3DBD6' }} />
          </div>
          <button type="submit" style={{ marginTop: 16, background: '#B37775', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            {editUser ? 'Update' : 'Create'}
          </button>
          <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} style={{ marginLeft: 16, background: '#EDE8E6', color: '#B37775', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
            Cancel
          </button>
          {error && <div style={{ color: '#B37775', marginTop: 12 }}>{error}</div>}
        </form>
      )}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.95)', borderRadius: 12 }}>
          <thead>
            <tr style={{ background: '#E3DBD6', color: '#B37775' }}>
              <th style={{ padding: 12, borderRadius: '12px 0 0 0' }}>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ borderRadius: '0 12px 0 0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #E3DBD6' }}>
                <td style={{ padding: 10 }}>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.status}</td>
                <td>
                  <button
                    style={{ background: '#B37775', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', marginRight: 8, cursor: 'pointer' }}
                    onClick={() => handleEdit(u)}
                  >
                    Edit
                  </button>
                  {u.status !== 'inactive' && (
                    <button
                      style={{ background: '#C58C72', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', marginRight: 8, cursor: 'pointer' }}
                      onClick={() => handleDeactivate(u.id)}
                    >
                      Deactivate
                    </button>
                  )}
                  {u.status === 'inactive' && (
                    <span style={{ color: '#C58C72', fontWeight: 600 }}>Inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManagerDashboard;