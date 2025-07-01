import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

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
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    location: 'Oaxaca City',
    category: '',
    paymentMethod: ''
  });

  // Check if user is logged in when app loads
  useEffect(() => {
    const token = localStorage.getItem('co404_token');
    if (token) {
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch transactions when location filter changes
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchBusinessData();
      if (user.role === 'admin') {
        fetchLocationSummary();
      }
    }
  }, [selectedLocation, user]);

  // Fetch user info
  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('https://co404-finance-app.onrender.com/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        fetchTransactions(token);
        fetchBusinessData(token);
        if (userData.role === 'admin') {
          fetchLocationSummary(token);
        }
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
      const response = await fetch('https://co404-finance-app.onrender.com/api/business-data', {
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
      const response = await fetch(`https://co404-finance-app.onrender.com/api/transactions${locationParam}`, {
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  // Fetch location summary for admin
  const fetchLocationSummary = async (token = localStorage.getItem('co404_token')) => {
    try {
      const response = await fetch('https://co404-finance-app.onrender.com/api/location-summary', {
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
      const response = await fetch('https://co404-finance-app.onrender.com/api/login', {
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
        fetchTransactions(data.token);
        fetchBusinessData(data.token);
        if (data.user.role === 'admin') {
          fetchLocationSummary(data.token);
        }
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
        const response = await fetch('https://co404-finance-app.onrender.com/api/transactions', {
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
                <strong>Demo Credentials:</strong><br/>
                Admin: laurens / admin123<br/>
                Manager: santi / manager123<br/>
                Volunteer: volunteer1 / volunteer123
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
            <div className="stat-value income">{getCurrencySymbol()}{totalIncome.toFixed(2)}</div>
            <div>Total Income</div>
          </div>
          <div className="stat-card">
            <div className="stat-value expense">{getCurrencySymbol()}{totalExpenses.toFixed(2)}</div>
            <div>Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value balance">{getCurrencySymbol()}{totalBalance.toFixed(2)}</div>
            <div>Net Balance</div>
          </div>
        </div>

        {/* Charts */}
        <div className="analytics">
          <h3>Financial Analytics{selectedLocation !== 'all' ? ` - ${selectedLocation}` : ' - All Locations'}</h3>
          <div className={`charts-grid ${user.role !== 'admin' || selectedLocation !== 'all' ? 'single-chart' : ''}`}>
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
                  <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toFixed(2)}`} />
                  <Legend />
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
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Add Transaction Form */}
        <div className="add-transaction">
          <h3>Add New Transaction</h3>
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
            
            <button type="submit" className="submit-btn">Add Transaction</button>
          </form>
        </div>

        {/* Enhanced Recent Transactions */}
        <div className="transactions">
          <h3>Recent Transactions{selectedLocation !== 'all' ? ` - ${selectedLocation}` : ''}</h3>
          {transactions.map(transaction => (
            <div key={transaction.id} className={`transaction ${transaction.type}`}>
              <div className="transaction-main">
                <div className="transaction-info">
                  <span className="transaction-description">{transaction.description}</span>
                  <div className="transaction-details">
                    <span className="category-badge">{transaction.category}</span>
                    <span className="payment-badge">{transaction.paymentMethod}</span>
                  </div>
                  <small className="transaction-meta">
                    {transaction.location} • Added by: {transaction.addedBy}
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
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;