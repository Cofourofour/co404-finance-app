const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';

// Currency conversion rates
const EXCHANGE_RATES = {
  'MXN': 20,     // 20 MXN = 1 USD
  'COP': 4000,   // 4000 COP = 1 USD
  'USD': 1       // 1 USD = 1 USD
};

// Location currency mapping
const LOCATION_CURRENCY = {
  'San Cristóbal': 'MXN',
  'Oaxaca City': 'MXN',
  'Medellín': 'COP'
};

// Middleware
app.use(cors());
app.use(express.json());

// Users database
const users = [
  {
    id: 1,
    username: 'laurens',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'admin',
    name: 'Laurens',
    location: 'all'
  },
  {
    id: 2,
    username: 'santi',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'manager',
    name: 'Santi',
    location: 'San Cristóbal'
  },
  {
    id: 3,
    username: 'leo',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'manager',
    name: 'Leo',
    location: 'Medellín'
  },
  {
    id: 4,
    username: 'ivonne',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'manager',
    name: 'Ivonne',
    location: 'Oaxaca City'
  }
];

// Enhanced transactions with currency
let transactions = [
  { id: 1, description: 'Guest Stay Revenue', amount: 2000, type: 'income', location: 'Oaxaca City', currency: 'MXN', date: new Date().toISOString(), addedBy: 'ivonne' },
  { id: 2, description: 'Office Rent', amount: -24000, type: 'expense', location: 'Oaxaca City', currency: 'MXN', date: new Date().toISOString(), addedBy: 'ivonne' },
  { id: 3, description: 'Equipment Purchase', amount: -2000000, type: 'expense', location: 'Medellín', currency: 'COP', date: new Date().toISOString(), addedBy: 'leo' },
  { id: 4, description: 'Guest Stay Revenue', amount: 1600000, type: 'income', location: 'Medellín', currency: 'COP', date: new Date().toISOString(), addedBy: 'leo' },
  { id: 5, description: 'Beer Sales', amount: 600, type: 'income', location: 'San Cristóbal', currency: 'MXN', date: new Date().toISOString(), addedBy: 'santi' },
  { id: 6, description: 'Coffee Supplies', amount: -400, type: 'expense', location: 'San Cristóbal', currency: 'MXN', date: new Date().toISOString(), addedBy: 'santi' }
];

let nextId = 7;

// Helper function to convert to USD
const convertToUSD = (amount, currency) => {
  return amount / EXCHANGE_RATES[currency];
};

// Helper function to format currency
const formatCurrency = (amount, currency) => {
  const symbols = { MXN: '$', COP: '$', USD: '$' };
  return `${symbols[currency]}${amount.toLocaleString()} ${currency}`;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = password === 'admin123' || password === 'manager123';
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, location: user.location },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      location: user.location
    }
  });
});

// Get current user info
app.get('/api/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    location: user.location
  });
});

// Get transactions with optional location filter
app.get('/api/transactions', authenticateToken, (req, res) => {
  const { location } = req.query; // Get location filter from query params
  let filteredTransactions = transactions;

  // Filter based on user role first
  if (req.user.role === 'manager') {
    filteredTransactions = transactions.filter(t => t.location === req.user.location);
  } else if (req.user.role === 'admin' && location && location !== 'all') {
    // Admin can filter by specific location
    filteredTransactions = transactions.filter(t => t.location === location);
  }

  // Add USD conversion for display
  const transactionsWithUSD = filteredTransactions.map(t => ({
    ...t,
    amountUSD: convertToUSD(t.amount, t.currency),
    formattedAmount: formatCurrency(t.amount, t.currency)
  }));

  res.json(transactionsWithUSD.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Add new transaction
app.post('/api/transactions', authenticateToken, (req, res) => {
  const { description, amount, type, location } = req.body;
  
  // Determine location and currency
  let transactionLocation = location;
  if (req.user.role === 'manager') {
    transactionLocation = req.user.location;
  }
  
  const currency = LOCATION_CURRENCY[transactionLocation];
  
  const transaction = {
    id: nextId++,
    description,
    amount: Number(amount),
    type,
    location: transactionLocation,
    currency,
    date: new Date().toISOString(),
    addedBy: req.user.username
  };
  
  transactions.push(transaction);
  
  // Return with USD conversion
  const transactionWithUSD = {
    ...transaction,
    amountUSD: convertToUSD(transaction.amount, currency),
    formattedAmount: formatCurrency(transaction.amount, currency)
  };
  
  res.json(transactionWithUSD);
});

// Get location summary (for admin dashboard)
app.get('/api/location-summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const locationSummary = ['San Cristóbal', 'Oaxaca City', 'Medellín'].map(location => {
    const locationTransactions = transactions.filter(t => t.location === location);
    const income = locationTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0);
    const expenses = Math.abs(locationTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0));
    
    return {
      name: location,
      currency: LOCATION_CURRENCY[location],
      income,
      expenses,
      net: income - expenses,
      transactionCount: locationTransactions.length
    };
  });

  res.json(locationSummary);
});

// Health check
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Co404 Finance API with Multi-Currency is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});