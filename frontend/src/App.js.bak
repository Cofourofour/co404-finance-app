import { TypeScriptTest } from './components/test/TypeScriptTest';
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

const API_BASE_URL = 'https://co404-finance-app.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locationSummary, setLocationSummary] = useState([]);
  const [businessData, setBusinessData] = useState({
    expenseCategories: [],
    incomeCategories: [],
    paymentMethods: []
  });

  // Shift Management State
  const [activeShift, setActiveShift] = useState(null);
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    startingCash: '',
    shiftType: 'morning',
    location: 'Oaxaca City'
  });
  const [cashCount, setCashCount] = useState({
    1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0
  });

  // 🔥 NEW VARIANCE HANDLING STATE
  const [varianceInfo, setVarianceInfo] = useState(null);
  const [showVarianceModal, setShowVarianceModal] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    location: 'Oaxaca City',
    category: '',
    paymentMethod: ''
  });

  // Excel upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLocation, setUploadLocation] = useState('Oaxaca City');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showUploadResults, setShowUploadResults] = useState(false);

  // Check if user is logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem('co404_token');
    if (token) {
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch data when location filter changes
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchBusinessData();
      if (user.role === 'admin') {
        fetchLocationSummary();
      }
    }
  }, [selectedLocation, user]);

  // Fetch active shift when user logs in
  useEffect(() => {
    if (user) {
      fetchActiveShift();
    }
  }, [user]);

  // Shift Management Functions
  const handleStartShift = async (e) => {
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
        setShiftForm({ 
          startingCash: '', 
          shiftType: 'morning', 
          location: user.location === 'all' ? 'Oaxaca City' : user.location || 'Oaxaca City' 
        });
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

// 🔥 ENHANCED SHIFT END WITH VARIANCE HANDLING
  const handleEndShift = async (acceptVariance = false) => {
    setShiftLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        },
        body: JSON.stringify({ 
          cashCount,
          acceptVariance 
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Check if variance was detected
        if (result.varianceDetected && !acceptVariance) {
          setVarianceInfo(result);
          setShowVarianceModal(true);
          setShiftLoading(false);
          return;
        }
        
        // Shift completed successfully
        setActiveShift(null);
        setShowEndShift(false);
        setShowVarianceModal(false);
        setVarianceInfo(null);
        setCashCount({ 1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0 });
        
        alert(result.summary.message);
        
        // Refresh transactions
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

  const calculateCashTotal = () => {
    const denominations = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return denominations.reduce((total, denom) => total + (denom * (cashCount[denom] || 0)), 0);
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
const handleCountAgain = () => {
    setShowVarianceModal(false);
    setVarianceInfo(null);
    // Keep the end shift modal open so they can recount
  };

  const handleAcceptVariance = () => {
    setShowVarianceModal(false);
    handleEndShift(true); // Call with acceptVariance = true
  };
  // Fetch user info
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setLoading(false);
      } else {
        localStorage.removeItem('co404_token');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      localStorage.removeItem('co404_token');
      setLoading(false);
    }
  };

  // Fetch business data
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

  // Fetch transactions
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
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch location summary
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

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('co404_token', data.token);
        setUser(data.user);
      } else {
        const error = await response.json();
        setLoginError(error.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Connection error');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('co404_token');
    setUser(null);
    setTransactions([]);
    setLocationSummary([]);
    setSelectedLocation('all');
    setActiveShift(null);
  };

  // Handle location change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  // Handle transaction type change
  const handleTypeChange = (type) => {
    const categories = type === 'income' ? businessData.incomeCategories : businessData.expenseCategories;
    setNewTransaction(prev => ({ ...prev, type, category: categories[0] || '' }));
  };

  // Add transaction
  const addTransaction = async (e) => {
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
          }),
        });
        
        if (response.ok) {
          fetchTransactions();
          if (user.role === 'admin') {
            fetchLocationSummary();
          }
          setNewTransaction(prev => ({ 
            ...prev, 
            description: '', 
            amount: '', 
            location: user.location === 'all' ? 'Oaxaca City' : user.location 
          }));
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    }
  };

  // Excel file upload
  const handleFileUpload = async (e) => {
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

  // Analytics calculations
  const totalIncome = selectedLocation === 'all' 
    ? transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amountUSD, 0)
    : transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = selectedLocation === 'all'
    ? Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amountUSD, 0))
    : Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    
  const totalBalance = totalIncome - totalExpenses;

// 🔥 ENHANCED CURRENCY DISPLAY FUNCTION
  const getCurrencySymbol = () => {
    // Admin logic: USD when "All Locations" selected, otherwise local currency
    if (user?.role === 'admin') {
      if (selectedLocation === 'all') {
        return '$USD';
      } else {
        const locationCurrency = {
          'San Cristóbal': '$MXN',
          'Oaxaca City': '$MXN', 
          'Medellín': '$COP'
        };
        return locationCurrency[selectedLocation] || '$';
      }
    }
    
    // Managers/Volunteers: Always show local currency
    const userLocationCurrency = {
      'San Cristóbal': '$MXN',
      'Oaxaca City': '$MXN', 
      'Medellín': '$COP'
    };
    return userLocationCurrency[user?.location] || '$MXN';
  };

  // Get available categories
  const getAvailableCategories = () => {
    return newTransaction.type === 'income' ? businessData.incomeCategories : businessData.expenseCategories;
  };

  // Loading screen
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

  // Login screen
  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Co404 Finance Dashboard</h1>
          <div className="login-container">
            <h3>Welcome Back!</h3>
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
              <button type="submit">Login</button>
              {loginError && <p className="error">{loginError}</p>}
            </form>
            <div className="demo-credentials">
              <small>
                <strong>🔥 Updated Demo Credentials (Password: "password"):</strong><br/>
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
        </header>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="App">
      <header className="App-header">
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
              <button 
                className={selectedLocation === 'all' ? 'active' : ''}
                onClick={() => handleLocationChange('all')}
              >
                All Locations (USD)
              </button>
              <button 
                className={selectedLocation === 'San Cristóbal' ? 'active' : ''}
                onClick={() => handleLocationChange('San Cristóbal')}
              >
                San Cristóbal (MXN)
              </button>
              <button 
                className={selectedLocation === 'Oaxaca City' ? 'active' : ''}
                onClick={() => handleLocationChange('Oaxaca City')}
              >
                Oaxaca City (MXN)
              </button>
              <button 
                className={selectedLocation === 'Medellín' ? 'active' : ''}
                onClick={() => handleLocationChange('Medellín')}
              >
                Medellín (COP)
              </button>
            </div>
          </div>
        )}

        {/* 1. SHIFT MANAGEMENT SECTION */}
        <div className="add-transaction">
          <h3>🏨 Shift Management</h3>
          
          {activeShift ? (
            <div style={{
              background: 'linear-gradient(135deg, #C58C72, #B37775)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '1rem'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <h4 style={{margin: 0, fontSize: '1.2rem'}}>✅ Shift Active</h4>
                  <p style={{margin: '0.5rem 0 0 0', opacity: 0.9}}>
                    {activeShift.shiftType} shift • Started with ${activeShift.startingCash} • {activeShift.location}
                  </p>
                </div>
                <button 
                  onClick={() => setShowEndShift(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  🏁 End Shift & Count Cash
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#F8F9FA',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <p style={{margin: '0 0 1rem 0', color: '#666'}}>No active shift</p>
              <button 
                onClick={() => setShowStartShift(true)}
                style={{
                  padding: '1rem 2rem',
                  background: '#C58C72',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                🚀 Start Shift
              </button>
            </div>
          )}
        </div>

        {/* 2. STATS OVERVIEW */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value income">{getCurrencySymbol()}{totalIncome.toLocaleString()}</div>
            <div>Total Income</div>
          </div>
          <div className="stat-card">
            <div className="stat-value expense">{getCurrencySymbol()}{totalExpenses.toLocaleString()}</div>
            <div>Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value balance">{getCurrencySymbol()}{totalBalance.toLocaleString()}</div>
            <div>Net Balance</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{transactions.length}</div>
            <div>Total Transactions</div>
          </div>
        </div>

        {/* 3. ADD NEW TRANSACTION */}
        <div className="add-transaction">
          <h3>💰 Add New Transaction {activeShift ? '(Linked to Active Shift)' : ''}</h3>
          
          {!activeShift && (
            <div style={{
              background: '#FFF3CD',
              color: '#856404',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid #FFEAA7'
            }}>
              ⚠️ No active shift - transactions won't be linked to a shift
            </div>
          )}
          
          <form onSubmit={addTransaction} className="enhanced-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Description"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                required
              />
            </div>
            
            <div className="form-row">
              <select
                value={newTransaction.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                required
              >
                <option value="expense">💸 Expense</option>
                <option value="income">💰 Income</option>
              </select>
              
              <select
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                required
              >
                <option value="">Select Category</option>
                {getAvailableCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="form-row">
              <select
                value={newTransaction.paymentMethod}
                onChange={(e) => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                required
              >
                <option value="">Payment Method</option>
                {businessData.paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
              
              {user.role === 'admin' && (
                <select
                  value={newTransaction.location}
                  onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})}
                  required
                >
                  <option value="Oaxaca City">Oaxaca City</option>
                  <option value="San Cristóbal">San Cristóbal</option>
                  <option value="Medellín">Medellín</option>
                </select>
              )}
            </div>
            
            <button type="submit" className="submit-btn">✨ Add Transaction</button>
          </form>
        </div>

        {/* 4. RECENT TRANSACTIONS */}
        <div className="transactions">
          <h3>📊 Recent Transactions{selectedLocation !== 'all' ? ` - ${selectedLocation}` : ''} ({transactions.length})</h3>
          {transactions.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              No transactions found. Add your first transaction above!
            </div>
          ) : (
            transactions.slice(0, 20).map(transaction => (
              <div key={transaction.id} className={`transaction ${transaction.type}`}>
                <div className="transaction-main">
                  <div className="transaction-info">
                    <span className="transaction-description">{transaction.description}</span>
                    <div className="transaction-details">
                      <span className="category-badge">{transaction.category}</span>
                      <span className="payment-badge">{transaction.paymentMethod}</span>
                    </div>
                    <small className="transaction-meta">
                      {transaction.location} • Added by: {transaction.addedBy} • {new Date(transaction.date).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="transaction-amount">
                    <span className="amount">{transaction.formattedAmount}</span>
                    {selectedLocation === 'all' && (
                      <small className="usd-amount">
                        ${transaction.amountUSD.toFixed(2)} USD
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. EXCEL UPLOAD SECTION - BOTTOM - Admin Only */}
        {user.role === 'admin' && (
          <div className="add-transaction">
            <h3>📤 Excel File Import</h3>
            <form onSubmit={handleFileUpload} className="enhanced-form">
              <div className="form-row">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
                <select
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                >
                  <option value="Oaxaca City">Oaxaca City</option>
                  <option value="San Cristóbal">San Cristóbal</option>
                  <option value="Medellín">Medellín</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={uploadLoading || !uploadFile}
              >
                {uploadLoading ? '⏳ Uploading...' : '📤 Upload Excel File'}
              </button>
            </form>
            
            <div style={{fontSize: '0.9rem', color: '#666', marginTop: '1rem'}}>
              <strong>Expected Excel format:</strong> Date | Type | Who | Payment Method | Category | Description | Amount
            </div>
          </div>
        )}

        {/* MODALS */}
        {/* MODALS */}
{/* 🔥 NEW VARIANCE DETECTION MODAL */}
        {showVarianceModal && varianceInfo && (
          <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(67, 54, 45, 0.9)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1001,
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '3rem',
              width: '95vw',
              maxWidth: '600px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}>
                {varianceInfo.variance > 0 ? '⚠️' : '❌'}
              </div>
              
              <h2 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '1.8rem',
                fontWeight: '700',
                color: varianceInfo.variance > 0 ? '#D68910' : '#B03A2E',
                marginBottom: '1rem'
              }}>
                Cash Count Variance Detected!
              </h2>
              
              <div style={{
                background: '#F8F9FA',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Starting Cash:</span>
                  <strong>${varianceInfo.startingCash.toLocaleString()}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Transaction Total:</span>
                  <strong style={{color: varianceInfo.transactionTotal >= 0 ? '#28A745' : '#DC3545'}}>
                    ${varianceInfo.transactionTotal.toLocaleString()}
                  </strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span>Expected Total:</span>
                  <strong>${varianceInfo.expectedTotal.toLocaleString()}</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  <span>Your Count:</span>
                  <strong>${varianceInfo.actualTotal.toLocaleString()}</strong>
                </div>
                <hr style={{margin: '1rem 0'}} />
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem'}}>
                  <span>Variance:</span>
                  <strong style={{
                    color: varianceInfo.variance > 0 ? '#D68910' : '#B03A2E',
                    fontSize: '1.3rem'
                  }}>
                    {varianceInfo.variance > 0 ? '+' : ''}${varianceInfo.variance.toLocaleString()}
                  </strong>
                </div>
              </div>

              <p style={{
                color: '#666',
                marginBottom: '2rem',
                fontSize: '1.1rem',
                lineHeight: '1.5'
              }}>
                {varianceInfo.message}
              </p>
              
              <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
                <button 
                  onClick={handleCountAgain}
                  style={{
                    padding: '1rem 2rem',
                    background: '#3498DB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    minWidth: '150px'
                  }}
                >
                  🔄 Count Again
                </button>
                <button 
                  onClick={handleAcceptVariance}
                  style={{
                    padding: '1rem 2rem',
                    background: varianceInfo.variance > 0 ? '#D68910' : '#B03A2E',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    minWidth: '150px'
                  }}
                >
                  ✅ Accept Variance
                </button>
              </div>
              
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#FFF3CD',
                borderRadius: '8px',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                💡 <strong>Tip:</strong> If you choose "Count Again", you can recount your cash. If you're confident in your count, choose "Accept Variance" to complete the shift.
              </div>
            </div>
          </div>
        )}
        {/* Start Shift Modal */}
        {showStartShift && (
          <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(67, 54, 45, 0.8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              width: '95vw',
              maxWidth: '500px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowStartShift(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: '#EDE8E6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#43362D'
                }}
              >
                ✕
              </button>

              <h2 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#43362D',
                marginBottom: '0.5rem'
              }}>
                🚀 Start Your Shift
              </h2>
              
              <p style={{
                color: '#666',
                marginBottom: '2rem',
                fontSize: '1rem'
              }}>
                Begin your work session and track transactions
              </p>
              
              <form onSubmit={handleStartShift} style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {/* Location Selector - Only for Admin */}
                {user.role === 'admin' && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontWeight: '600',
                      color: '#43362D'
                    }}>
                      📍 Location
                    </label>
                    <select
                      value={shiftForm.location}
                      onChange={(e) => setShiftForm({...shiftForm, location: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #EDE8E6',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        background: '#F8F9FA'
                      }}
                    >
                      <option value="">Select Location</option>
                      <option value="Oaxaca City">🏨 Oaxaca City</option>
                      <option value="San Cristóbal">🏨 San Cristóbal</option>
                      <option value="Medellín">🏨 Medellín</option>
                    </select>
                  </div>
                )}
                
                {/* Shift Type */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#43362D'
                  }}>
                    ⏰ Shift Type
                  </label>
                  <select
                    value={shiftForm.shiftType}
                    onChange={(e) => setShiftForm({...shiftForm, shiftType: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #EDE8E6',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      background: '#F8F9FA'
                    }}
                  >
                    <option value="morning">🌅 Morning Shift</option>
                    <option value="evening">🌙 Evening Shift</option>
                  </select>
                </div>
                
                {/* Starting Cash */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#43362D'
                  }}>
                    💰 Starting Cash Amount
                  </label>
                  <input
                    type="number"
                    value={shiftForm.startingCash}
                    onChange={(e) => setShiftForm({...shiftForm, startingCash: e.target.value})}
                    placeholder="1000"
                    required
                    min="0"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #EDE8E6',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      background: '#F8F9FA'
                    }}
                  />
                </div>
                
                <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem'}}>
                  <button 
                    type="button"
                    onClick={() => setShowStartShift(false)}
                    style={{
                      padding: '1rem 2rem',
                      background: '#EDE8E6',
                      color: '#43362D',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={shiftLoading}
                    style={{
                      padding: '1rem 2rem',
                      background: '#C58C72',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      opacity: shiftLoading ? 0.7 : 1
                    }}
                  >
                    {shiftLoading ? '⏳ Starting...' : '🚀 Start Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* End Shift & Cash Count Modal */}
        {showEndShift && (
          <div style={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(67, 54, 45, 0.8)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              width: '95vw',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              <button 
                onClick={() => setShowEndShift(false)}
                style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: '#EDE8E6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  color: '#43362D'
                }}
              >
                ✕
              </button>

              <h2 style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '1.8rem',
                fontWeight: '700',
                color: '#43362D',
                marginBottom: '0.5rem'
              }}>
                💰 Count Your Cash Box
              </h2>
              
              <p style={{
                color: '#666',
                marginBottom: '2rem',
                fontSize: '1rem'
              }}>
                Count each denomination and enter the quantities below
              </p>
              
              <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem', 
                marginBottom: '2rem'
              }}>
                {[1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map(denom => (
                  <div key={denom} style={{
                    background: '#F8F9FA',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid #EDE8E6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <label style={{
                        fontWeight: '600',
                        color: '#43362D',
                        fontSize: '1rem'
                      }}>
                        ${denom} pesos
                      </label>
                      <input
                        type="number"
                        value={cashCount[denom]}
                        onChange={(e) => setCashCount({...cashCount, [denom]: Number(e.target.value) || 0})}
                        min="0"
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          border: '2px solid #EDE8E6',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div style={{
                      color: '#C58C72',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      = ${(denom * cashCount[denom]).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #C58C72, #B37775)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  margin: 0
                }}>
                  Total Counted: ${calculateCashTotal().toLocaleString()} MXN
                </h3>
              </div>
              
              <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                <button 
                  onClick={() => setShowEndShift(false)}
                  style={{
                    padding: '1rem 2rem',
                    background: '#EDE8E6',
                    color: '#43362D',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEndShift}
                  disabled={shiftLoading}
                  style={{
                    padding: '1rem 2rem',
                    background: '#B37775',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    opacity: shiftLoading ? 0.7 : 1
                  }}
                >
                  {shiftLoading ? '⏳ Ending...' : '🏁 End Shift'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Results Modal */}
        {showUploadResults && uploadResults && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <h3>📊 Upload Results</h3>
              <div style={{
                background: uploadResults.success ? '#d4edda' : '#f8d7da',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <strong>{uploadResults.message}</strong><br/>
                ✅ Imported: {uploadResults.imported} transactions<br/>
                ❌ Errors: {uploadResults.errors}<br/>
                📋 Total rows: {uploadResults.totalRows}
              </div>
              
              <button 
                onClick={() => setShowUploadResults(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ✖️ Close
              </button>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;