import React, { useState, useEffect } from 'react';
import { TypeScriptTest } from '../components/test/TypeScriptTest';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const API_BASE_URL = 'https://co404-finance-app.onrender.com';

const AdminDashboard: React.FC = () => {
  // All hooks must be at the top
  const { user, logout, loading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locationSummary, setLocationSummary] = useState<any[]>([]);
  const [businessData, setBusinessData] = useState({ expenseCategories: [], incomeCategories: [], paymentMethods: [] });
  const [activeShift, setActiveShift] = useState<any>(null);
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftForm, setShiftForm] = useState({ startingCash: '', shiftType: 'morning', location: 'Oaxaca City' });
  const [cashCount, setCashCount] = useState({ 1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0 });
  const [varianceInfo, setVarianceInfo] = useState<any>(null);
  const [showVarianceModal, setShowVarianceModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense', location: 'Oaxaca City', category: '', paymentMethod: '' });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLocation, setUploadLocation] = useState('Oaxaca City');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [showUploadResults, setShowUploadResults] = useState(false);

  // Effects
  useEffect(() => {}, []);
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchBusinessData();
      fetchLocationSummary();
      fetchActiveShift();
    }
    // eslint-disable-next-line
  }, [selectedLocation, user]);

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Co404 Finance Dashboard</h1>
          <p>Loading...</p>
        </header>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // --- Handlers and Effects from App.js.bak ---
  // fetchUserInfo is not needed here; user is managed by useAuth

  const fetchBusinessData = async (token = localStorage.getItem('co404_token')) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/business-data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBusinessData(data);
        setNewTransaction(prev => ({
          ...prev,
          category: data.expenseCategories[0] || '',
          paymentMethod: data.paymentMethods[0] || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const fetchTransactions = async (token = localStorage.getItem('co404_token')) => {
    try {
      const locationParam = user?.role === 'admin' ? `?location=${selectedLocation}` : '';
      const response = await fetch(`${API_BASE_URL}/api/transactions${locationParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else if (response.status === 401) {
        localStorage.removeItem('co404_token');
        logout();
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchLocationSummary = async (token = localStorage.getItem('co404_token')) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLocationSummary(data);
      }
    } catch (error) {
      console.error('Error fetching location summary:', error);
    }
  };

  const fetchActiveShift = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/active`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('co404_token')}` }
      });
      if (response.ok) {
        const shift = await response.json();
        setActiveShift(shift);
      }
    } catch (error) {
      console.error('Fetch active shift error:', error);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        },
        body: JSON.stringify({
          startingCash: Number(shiftForm.startingCash),
          shiftType: shiftForm.shiftType,
          location: user.role === 'admin' ? shiftForm.location : user.location
        })
      });
      if (response.ok) {
        const shift = await response.json();
        setActiveShift(shift);
        setShowStartShift(false);
        setShiftForm({ startingCash: '', shiftType: 'morning', location: user.location === 'all' ? 'Oaxaca City' : user.location || 'Oaxaca City' });
        alert('✅ Shift started successfully!');
      } else {
        const error = await response.json();
        alert(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error('Start shift error:', error);
      alert('❌ Connection error');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleEndShift = async (acceptVariance = false) => {
    setShiftLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        },
        body: JSON.stringify({ cashCount, acceptVariance })
      });
      const result = await response.json();
      if (response.ok) {
        if (result.varianceDetected && !acceptVariance) {
          setVarianceInfo(result);
          setShowVarianceModal(true);
          setShiftLoading(false);
          return;
        }
        setActiveShift(null);
        setShowEndShift(false);
        setShowVarianceModal(false);
        setVarianceInfo(null);
        setCashCount({ 1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0 });
        alert(result.summary.message);
        fetchTransactions();
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('End shift error:', error);
      alert('❌ Connection error');
    } finally {
      setShiftLoading(false);
    }
  };

  const handleCountAgain = () => {
    setShowVarianceModal(false);
    setVarianceInfo(null);
  };

  const handleAcceptVariance = () => {
    setShowVarianceModal(false);
    handleEndShift(true);
  };

  const handleTypeChange = (type: string) => {
    const categories = type === 'income' ? businessData.incomeCategories : businessData.expenseCategories;
    setNewTransaction(prev => ({ ...prev, type, category: categories[0] || '' }));
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransaction.description && newTransaction.amount && newTransaction.category && newTransaction.paymentMethod) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
          },
          body: JSON.stringify({
            description: newTransaction.description,
            amount: newTransaction.type === 'expense' ? -Math.abs(Number(newTransaction.amount)) : Number(newTransaction.amount),
            type: newTransaction.type,
            location: newTransaction.location,
            category: newTransaction.category,
            paymentMethod: newTransaction.paymentMethod
          })
        });
        if (response.ok) {
          fetchTransactions();
          if (user.role === 'admin') {
            fetchLocationSummary();
          }
          setNewTransaction(prev => ({ ...prev, description: '', amount: '', location: user.location === 'all' ? 'Oaxaca City' : user.location }));
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }
    setUploadLoading(true);
    setUploadResults(null);
    setShowUploadResults(false);
    try {
      const formData = new FormData();
      formData.append('excelFile', uploadFile);
      formData.append('location', uploadLocation);
      const response = await fetch(`${API_BASE_URL}/api/upload-excel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('co404_token')}` },
        body: formData
      });
      const result = await response.json();
      if (response.ok) {
        setUploadResults(result);
        setShowUploadResults(true);
        setUploadFile(null);
        fetchTransactions();
        if (user.role === 'admin') {
          fetchLocationSummary();
        }
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: Connection error');
    } finally {
      setUploadLoading(false);
    }
  };

  const calculateCashTotal = () => {
    const denominations = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return denominations.reduce((total, denom) => total + (denom * (cashCount[denom] || 0)), 0);
  };

  // Remove all setUser(null) and setLoading(false) calls in handlers
  // Use logout() from useAuth for logging out
  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  // Fix locationSummary usage: if it's an array, show summary for selected location or all
  const summary = Array.isArray(locationSummary)
    ? locationSummary.find((s) => s.location === selectedLocation) || {}
    : locationSummary || {};

  // --- UI ---
  // DEBUG OUTPUT
  console.log('user', user);
  console.log('transactions', transactions);
  console.log('businessData', businessData);
  console.log('locationSummary', locationSummary);
  // Main dashboard
  return (
    <div className="App">
      <header className="App-header">
        {/* DEBUG: Show raw data for troubleshooting */}
        <div style={{ background: '#fffbe6', color: '#333', padding: '0.5rem', marginBottom: '1rem', border: '1px solid #ffe58f', borderRadius: 4 }}>
          <strong>DEBUG DATA:</strong>
          <pre style={{ fontSize: '0.8rem', maxHeight: 200, overflow: 'auto' }}>
            user: {JSON.stringify(user, null, 2)}
            {"\n"}
            transactions: {JSON.stringify(transactions, null, 2)}
            {"\n"}
            businessData: {JSON.stringify(businessData, null, 2)}
            {"\n"}
            locationSummary: {JSON.stringify(locationSummary, null, 2)}
          </pre>
        </div>
        <div className="header-top">
          <h1>Co404 Finance Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.name}!</span>
            <span className="role-badge">{user.role}</span>
            <span className="location-badge">{user.location}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
        <TypeScriptTest user={user} />
        {/* Location Filter Buttons - Admin Only */}
        {user.role === 'admin' && (
          <div className="location-filters">
            <h3>View Location:</h3>
            <div className="filter-buttons">
              <button className={selectedLocation === 'all' ? 'active' : ''} onClick={() => setSelectedLocation('all')}>All Locations (USD)</button>
              <button className={selectedLocation === 'San Cristóbal' ? 'active' : ''} onClick={() => setSelectedLocation('San Cristóbal')}>San Cristóbal (MXN)</button>
              <button className={selectedLocation === 'Oaxaca City' ? 'active' : ''} onClick={() => setSelectedLocation('Oaxaca City')}>Oaxaca City (MXN)</button>
              <button className={selectedLocation === 'Medellín' ? 'active' : ''} onClick={() => setSelectedLocation('Medellín')}>Medellín (COP)</button>
            </div>
          </div>
        )}
        {/* 1. SHIFT MANAGEMENT SECTION */}
        <div className="shift-management">
          <h2>Shift Management</h2>
          {activeShift ? (
            <div className="active-shift">
              <h3>Active Shift</h3>
              <p>Shift ID: {activeShift.id}</p>
              <p>Location: {activeShift.location}</p>
              <p>Shift Type: {activeShift.shiftType}</p>
              <p>Starting Cash: ${activeShift.startingCash.toFixed(2)}</p>
              <p>Cash Total: ${calculateCashTotal().toFixed(2)}</p>
              <button onClick={() => setShowEndShift(true)} className="end-shift-btn">End Shift</button>
            </div>
          ) : (
            <div className="no-active-shift">
              <p>No active shift. Please start a new shift.</p>
              <button onClick={() => setShowStartShift(true)} className="start-shift-btn">Start Shift</button>
            </div>
          )}
        </div>
        {/* 2. STATS OVERVIEW */}
        <div className="stats-overview">
          <h2>Statistics Overview</h2>
          <div className="stats-cards">
            <div className="stats-card">
              <h3>Total Income</h3>
              <p>${summary.totalIncome?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="stats-card">
              <h3>Total Expenses</h3>
              <p>${summary.totalExpenses?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="stats-card">
              <h3>Net Profit</h3>
              <p>${summary.netProfit?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
        {/* 3. ADD NEW TRANSACTION */}
        <div className="add-transaction">
          <h2>Add New Transaction</h2>
          <form onSubmit={addTransaction}>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input type="number" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={newTransaction.type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={newTransaction.location} onChange={e => setNewTransaction({ ...newTransaction, location: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={newTransaction.category} onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}>
                {businessData.expenseCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <select value={newTransaction.paymentMethod} onChange={e => setNewTransaction({ ...newTransaction, paymentMethod: e.target.value })}>
                {businessData.paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="add-transaction-btn">Add Transaction</button>
          </form>
        </div>
        {/* 4. RECENT TRANSACTIONS */}
        <div className="recent-transactions">
          <h2>Recent Transactions</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Location</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{transaction.description}</td>
                  <td>${Math.abs(transaction.amount).toFixed(2)}</td>
                  <td>{transaction.type}</td>
                  <td>{transaction.location}</td>
                  <td>{transaction.category}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td>{new Date(transaction.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 5. EXCEL UPLOAD SECTION - Admin Only */}
        {user.role === 'admin' && (
          <div className="excel-upload">
            <h2>Upload Transactions via Excel</h2>
            <form onSubmit={handleFileUpload}>
              <div className="form-group">
                <label>Excel File</label>
                <input type="file" accept=".xlsx, .xls" onChange={e => setUploadFile(e.target.files?.[0] || null)} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" value={uploadLocation} onChange={e => setUploadLocation(e.target.value)} required />
              </div>
              <button type="submit" className="upload-btn">Upload</button>
            </form>
            {uploadLoading && <p>Uploading...</p>}
            {showUploadResults && uploadResults && (
              <div className="upload-results">
                <h3>Upload Results</h3>
                <pre>{JSON.stringify(uploadResults, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
        {/* MODALS */}
        {showStartShift && (
          <div className="modal">
            <div className="modal-content">
              <h2>Start New Shift</h2>
              <form onSubmit={handleStartShift}>
                <div className="form-group">
                  <label>Starting Cash</label>
                  <input type="number" value={shiftForm.startingCash} onChange={e => setShiftForm({ ...shiftForm, startingCash: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Shift Type</label>
                  <select value={shiftForm.shiftType} onChange={e => setShiftForm({ ...shiftForm, shiftType: e.target.value })}>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                {user.role === 'admin' && (
                  <div className="form-group">
                    <label>Location</label>
                    <select value={shiftForm.location} onChange={e => setShiftForm({ ...shiftForm, location: e.target.value })}>
                      <option value="Oaxaca City">Oaxaca City</option>
                      <option value="San Cristóbal">San Cristóbal</option>
                      <option value="Medellín">Medellín</option>
                    </select>
                  </div>
                )}
                <button type="submit" className="start-shift-btn">Start Shift</button>
                <button onClick={() => setShowStartShift(false)} className="close-btn">Close</button>
              </form>
            </div>
          </div>
        )}
        {showEndShift && activeShift && (
          <div className="modal">
            <div className="modal-content">
              <h2>End Shift</h2>
              <p>Shift ID: {activeShift.id}</p>
              <p>Location: {activeShift.location}</p>
              <p>Shift Type: {activeShift.shiftType}</p>
              <p>Starting Cash: ${activeShift.startingCash.toFixed(2)}</p>
              <p>Cash Total: ${calculateCashTotal().toFixed(2)}</p>
              <button onClick={() => handleEndShift()} className="end-shift-btn">Confirm End Shift</button>
              <button onClick={() => setShowEndShift(false)} className="close-btn">Close</button>
            </div>
          </div>
        )}
        {showVarianceModal && varianceInfo && (
          <div className="modal">
            <div className="modal-content">
              <h2>Variance Detected</h2>
              <p>Expected Cash: ${varianceInfo.expectedCash.toFixed(2)}</p>
              <p>Actual Cash: ${varianceInfo.actualCash.toFixed(2)}</p>
              <p>Variance: ${varianceInfo.variance.toFixed(2)}</p>
              <button onClick={handleAcceptVariance} className="accept-variance-btn">Accept Variance</button>
              <button onClick={handleCountAgain} className="count-again-btn">Count Again</button>
              <button onClick={() => setShowVarianceModal(false)} className="close-btn">Close</button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default AdminDashboard;
