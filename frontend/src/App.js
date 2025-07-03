import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import './App.css';

// 🎯 PRODUCTION BACKEND URL - FIXED!
const API_BASE_URL = 'https://co404-finance-app.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locationSummary, setLocationSummary] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [businessData, setBusinessData] = useState({
    expenseCategories: [],
    incomeCategories: [],
    paymentMethods: []
  });
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
  // Shift management state
  const [activeShift, setActiveShift] = useState(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [showStartShift, setShowStartShift] = useState(false);
  const [showEndShift, setShowEndShift] = useState(false);
  const [startingCash, setStartingCash] = useState('');
  const [shiftType, setShiftType] = useState('morning');
  const [cashCount, setCashCount] = useState({
    1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 
    100: 0, 200: 0, 500: 0, 1000: 0
  });
  const [shiftSummary, setShiftSummary] = useState(null);

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
      fetchMonthlyData();
      if (user.role === 'admin') {
        fetchLocationSummary();
      }
    }
  }, [selectedLocation, user]);

// Fetch active shift when user loads
  useEffect(() => {
    if (user && (user.role === 'volunteer' || user.role === 'manager')) {
      fetchActiveShift();
    }
  }, [user]);

  // Fetch active shift
  const fetchActiveShift = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        }
      });
      
      if (response.ok) {
        const shift = await response.json();
        setActiveShift(shift);
      }
    } catch (error) {
      console.error('Error fetching active shift:', error);
    }
  };

  // Start shift
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
          startingCash: Number(startingCash),
          shiftType
        })
      });
      
      if (response.ok) {
        const shift = await response.json();
        setActiveShift(shift);
        setShowStartShift(false);
        setStartingCash('');
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
// Calculate total from cash count
  const calculateCashTotal = () => {
    const denominations = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return denominations.reduce((total, denom) => {
      return total + (denom * (cashCount[denom] || 0));
    }, 0);
  };
  // Fetch user info
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  // Fetch business data (categories, payment methods)
  const fetchBusinessData = async (token = localStorage.getItem('co404_token')) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/business-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusinessData(data);
        
        // Set default category and payment method
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

  // Fetch transactions with location filter
  const fetchTransactions = async (token = localStorage.getItem('co404_token')) => {
    try {
      const locationParam = user?.role === 'admin' ? `?location=${selectedLocation}` : '';
      const response = await fetch(`${API_BASE_URL}/api/transactions${locationParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else if (response.status === 401) {
        localStorage.removeItem('co404_token');
        setUser(null);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch monthly data for charts
  const fetchMonthlyData = async (token = localStorage.getItem('co404_token')) => {
    try {
      const locationParam = user?.role === 'admin' ? `?location=${selectedLocation}` : '';
      const response = await fetch(`${API_BASE_URL}/api/monthly-data${locationParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  // Fetch location summary for admin
  const fetchLocationSummary = async (token = localStorage.getItem('co404_token')) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/location-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      console.log('🔐 Attempting login to:', `${API_BASE_URL}/api/login`);
      
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('co404_token', data.token);
        setUser(data.user);
        console.log('✅ Login successful!');
      } else {
        const error = await response.json();
        setLoginError(error.error || 'Login failed');
        console.error('❌ Login failed:', error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoginError('Connection error - Cannot connect to backend server');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('co404_token');
    setUser(null);
    setTransactions([]);
    setLocationSummary([]);
    setMonthlyData([]);
    setSelectedLocation('all');
    setUploadResults(null);
    setShowUploadResults(false);
  };

  // Handle location filter change
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  // Handle transaction type change
  const handleTypeChange = (type) => {
    const categories = type === 'income' ? businessData.incomeCategories : businessData.expenseCategories;
    setNewTransaction(prev => ({
      ...prev,
      type,
      category: categories[0] || ''
    }));
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
          fetchMonthlyData();
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

      console.log('📤 Uploading Excel file to:', uploadLocation);

      const response = await fetch(`${API_BASE_URL}/api/upload-excel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResults(result);
        setShowUploadResults(true);
        setUploadFile(null);
        
        // Refresh data
        fetchTransactions();
        fetchMonthlyData();
        if (user.role === 'admin') {
          fetchLocationSummary();
        }
        
        console.log('✅ Excel upload successful!');
      } else {
        alert(`Upload failed: ${result.error}`);
        console.error('❌ Upload failed:', result);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Upload failed: Connection error');
    } finally {
      setUploadLoading(false);
    }
  };
  // End shift
  const handleEndShift = async () => {
    setShiftLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/shifts/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        },
        body: JSON.stringify({ cashCount })
      });
      
      if (response.ok) {
        const result = await response.json();
        setShiftSummary(result.summary);
        setActiveShift(null);
        setShowEndShift(false);
        setCashCount({
          1: 0, 2: 0, 5: 0, 10: 0, 20: 0, 50: 0, 
          100: 0, 200: 0, 500: 0, 1000: 0
        });
        fetchTransactions(); // Refresh transactions
      } else {
        const error = await response.json();
        alert(`❌ ${error.error}`);
      }
    } catch (error) {
      console.error('End shift error:', error);
      alert('❌ Connection error');
    } finally {
      setShiftLoading(false);
    }
  };

  // Clear all transactions (admin only)
  const handleClearAllTransactions = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear ALL transactions? This cannot be undone!')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/clear-transactions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('co404_token')}`
        }
      });

      if (response.ok) {
        alert('✅ All transactions cleared successfully!');
        fetchTransactions();
        fetchMonthlyData();
        fetchLocationSummary();
      } else {
        const error = await response.json();
        alert(`❌ Failed to clear transactions: ${error.error}`);
      }
    } catch (error) {
      console.error('Clear transactions error:', error);
      alert('❌ Connection error');
    }
  };

  // Analytics calculations (using USD for "all" view)
  const totalIncome = selectedLocation === 'all' 
    ? transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amountUSD, 0)
    : transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = selectedLocation === 'all'
    ? Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amountUSD, 0))
    : Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    
  const totalBalance = totalIncome - totalExpenses;

  // Currency symbol for display
  const getCurrencySymbol = () => {
    if (selectedLocation === 'all') return '$USD';
    const locationCurrency = {
      'San Cristóbal': '$MXN',
      'Oaxaca City': '$MXN', 
      'Medellín': '$COP'
    };
    return locationCurrency[selectedLocation] || '$';
  };

  // Income vs Expenses pie chart data
  const pieData = [
    { name: 'Income', value: totalIncome, color: '#C58C72' },
    { name: 'Expenses', value: totalExpenses, color: '#B37775' }
  ];

  // Category breakdown for pie chart
  const getCategoryData = () => {
    const categoryTotals = {};
    transactions.forEach(t => {
      const amount = selectedLocation === 'all' ? Math.abs(t.amountUSD) : Math.abs(t.amount);
      if (categoryTotals[t.category]) {
        categoryTotals[t.category] += amount;
      } else {
        categoryTotals[t.category] = amount;
      }
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  };

  // Get available categories based on transaction type
  const getAvailableCategories = () => {
    return newTransaction.type === 'income' ? businessData.incomeCategories : businessData.expenseCategories;
  };

  // Loading screen
  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Co404 Finance Dashboard</h1>
          <div className="loading-container">
            <div className="loading-shimmer" style={{height: '20px', borderRadius: '4px', marginBottom: '1rem'}}></div>
            <p>Loading your financial data...</p>
          </div>
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
              <button type="submit" className="submit-btn">Login</button>
              {loginError && <p className="error" style={{color: 'red', marginTop: '1rem'}}>{loginError}</p>}
            </form>
            <div className="demo-credentials">
              <small>
                <strong>Demo Credentials:</strong><br/>
                Admin: laurens / admin123<br/>
                Manager: santi / manager123<br/>
                Volunteer: volunteer1 / volunteer123
              </small>
            </div>
            <div style={{marginTop: '1rem', fontSize: '0.8rem', color: '#666'}}>
              Backend: {API_BASE_URL}
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
        <div className="header-top" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
          <h1>Co404 Finance Dashboard</h1>
          <div className="user-info" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <span>Welcome, {user.name}!</span>
            <span className={`role-badge ${user.role}`} style={{padding: '0.25rem 0.75rem', borderRadius: '20px', color: 'white', fontSize: '0.8rem'}}>{user.role}</span>
            <span className="location-badge" style={{padding: '0.25rem 0.75rem', background: '#EDE8E6', borderRadius: '20px', fontSize: '0.8rem'}}>{user.location}</span>
            <button onClick={handleLogout} className="logout-btn" style={{padding: '0.5rem 1rem', background: '#B37775', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}>Logout</button>
          </div>
        </div>

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
        
        {/* Stats Overview */}
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
        {/* Shift Management - Volunteers and Managers Only */}
        {(user.role === 'volunteer' || user.role === 'manager' || user.role === 'admin') && (
          <div className="add-transaction">
            <h3>🔄 Shift Management</h3>
            {!activeShift ? (
              <div>
                <p>No active shift. Start your shift to begin tracking cash and transactions.</p>
                <button 
                  onClick={() => setShowStartShift(true)}
                  className="submit-btn"
                >
                  🚀 Start Shift
                </button>
              </div>
            ) : (
              <div>
                <div style={{background: '#d4edda', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
                  <strong>✅ Active Shift ({activeShift.shiftType})</strong>
                  <br />
                  Started: {new Date(activeShift.startTime).toLocaleString()}
                  <br />
                  Starting Cash: ${activeShift.startingCash.toLocaleString()} MXN
                </div>
                <button 
                  onClick={() => setShowEndShift(true)}
                  className="submit-btn"
                  style={{background: '#dc3545'}}
                >
                  🏁 End Shift & Count Cash
                </button>
              </div>
            )}
          </div>
        )}

        {/* Excel Upload Section - Admin Only */}
        {user.role === 'admin' && (
          <div className="add-transaction">
            <h3>📤 Excel File Import</h3>
            <form onSubmit={handleFileUpload} className="enhanced-form">
              <div className="form-row">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{padding: '1rem', border: '2px solid #EDE8E6', borderRadius: '8px', background: '#EDE8E6'}}
                />
                <select
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  style={{padding: '1rem', border: '2px solid #EDE8E6', borderRadius: '8px', background: '#EDE8E6'}}
                >
                  <option value="Oaxaca City">Oaxaca City</option>
                  <option value="San Cristóbal">San Cristóbal</option>
                  <option value="Medellín">Medellín</option>
                </select>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={uploadLoading || !uploadFile}
                  style={{opacity: uploadLoading || !uploadFile ? 0.6 : 1}}
                >
                  {uploadLoading ? '⏳ Uploading...' : '📤 Upload Excel File'}
                </button>
                <button 
                  type="button" 
                  onClick={handleClearAllTransactions}
                  style={{padding: '1rem 2rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'}}
                >
                  🗑️ Clear All Data
                </button>
              </div>
            </form>
            
            <div style={{fontSize: '0.9rem', color: '#666', marginTop: '1rem'}}>
              <strong>Expected Excel format:</strong> Date | Type | Who | Payment Method | Category | Description | Amount
            </div>
          </div>
        )}

        {/* Upload Results */}
        {showUploadResults && uploadResults && (
          <div className="add-transaction">
            <h3>📊 Upload Results</h3>
            <div style={{background: uploadResults.success ? '#d4edda' : '#f8d7da', padding: '1rem', borderRadius: '8px', marginBottom: '1rem'}}>
              <strong>{uploadResults.message}</strong>
              <br />
              ✅ Imported: {uploadResults.imported} transactions
              <br />
              ❌ Errors: {uploadResults.errors}
              <br />
              📋 Total rows processed: {uploadResults.totalRows}
            </div>
            
            {uploadResults.errorDetails && uploadResults.errorDetails.length > 0 && (
              <div style={{maxHeight: '200px', overflow: 'auto', background: '#f8f9fa', padding: '1rem', borderRadius: '8px'}}>
                <strong>Error Details:</strong>
                {uploadResults.errorDetails.map((error, index) => (
                  <div key={index} style={{margin: '0.5rem 0', fontSize: '0.85rem', color: '#dc3545'}}>
                    {error}
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setShowUploadResults(false)}
              style={{marginTop: '1rem', padding: '0.5rem 1rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'}}
            >
              ✖️ Close
            </button>
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
              width: '90vw',
              maxWidth: '600px',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}>
              {/* Close button */}
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
                Begin tracking your cash box and transactions
              </p>

              <form onSubmit={handleStartShift}>
                <div style={{marginBottom: '1.5rem'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#43362D'
                  }}>
                    Shift Type
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #EDE8E6',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      background: 'white',
                      color: '#43362D',
                      fontFamily: 'Roboto, sans-serif'
                    }}
                  >
                    <option value="morning">🌅 Morning Shift</option>
                    <option value="evening">🌆 Evening Shift</option>
                  </select>
                </div>

                <div style={{marginBottom: '2rem'}}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#43362D'
                  }}>
                    Starting Cash Amount
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount in pesos"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      border: '2px solid #EDE8E6',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontFamily: 'Roboto, sans-serif'
                    }}
                  />
                </div>

                <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
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
              {/* Close button */}
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

        {/* Charts */}
        <div className="analytics">
          <h3>📈 Financial Analytics{selectedLocation !== 'all' ? ` - ${selectedLocation}` : ' - All Locations'}</h3>
          <div className="charts-grid">
            {/* Income vs Expenses Pie Chart */}
            <div className="chart-container">
              <h4>Income vs Expenses</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend Line Chart */}
            <div className="chart-container">
              <h4>Monthly Financial Trend</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#C58C72" strokeWidth={3} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#B37775" strokeWidth={3} name="Expenses" />
                  <Line type="monotone" dataKey="net" stroke="#43362D" strokeWidth={2} strokeDasharray="5 5" name="Net" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="chart-container">
              <h4>Top Categories</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getCategoryData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Location Performance Bar Chart - Admin viewing all locations only */}
            {user.role === 'admin' && selectedLocation === 'all' && (
              <div className="chart-container">
                <h4>Performance by Location (USD)</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={locationSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)} USD`} />
                    <Legend />
                    <Bar dataKey="income" fill="#C58C72" name="Income" />
                    <Bar dataKey="expenses" fill="#B37775" name="Expenses" />
                    <Bar dataKey="net" fill="#43362D" name="Net" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Add Transaction Form */}
        <div className="add-transaction">
          <h3>💼 Add New Transaction</h3>
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

        {/* Enhanced Recent Transactions */}
        <div className="transactions">
          <h3>📊 Recent Transactions{selectedLocation !== 'all' ? ` - ${selectedLocation}` : ''} ({transactions.length})</h3>
          {transactions.length === 0 ? (
            <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
              No transactions found. {user.role === 'admin' ? 'Upload an Excel file or add transactions manually.' : 'Add your first transaction above!'}
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
          {transactions.length > 20 && (
            <div style={{textAlign: 'center', padding: '1rem', color: '#666'}}>
              Showing first 20 transactions of {transactions.length} total
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;