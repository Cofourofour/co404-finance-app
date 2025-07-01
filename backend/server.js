const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory users database (we'll expand this)
const users = [
  {
    id: 1,
    username: 'laurens',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'admin123'
    role: 'admin',
    name: 'Laurens',
    location: 'all'
  },
  {
    id: 2,
    username: 'santi',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'manager123'
    role: 'manager',
    name: 'Santi',
    location: 'San Cristóbal'
  },
  {
    id: 3,
    username: 'leo',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'manager123'
    role: 'manager',
    name: 'Leo',
    location: 'Medellín'
  },
  {
    id: 4,
    username: 'ivonne',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'manager123'
    role: 'manager',
    name: 'Ivonne',
    location: 'Oaxaca City'
  }
];

// In-memory transactions database (expanded with user tracking)
let transactions = [
  { id: 1, description: 'Salary - Oaxaca', amount: 3000, type: 'income', location: 'Oaxaca City', date: new Date().toISOString(), addedBy: 'laurens' },
  { id: 2, description: 'Office Rent', amount: -1200, type: 'expense', location: 'Oaxaca City', date: new Date().toISOString(), addedBy: 'ivonne' },
  { id: 3, description: 'Equipment Purchase', amount: -500, type: 'expense', location: 'Medellín', date: new Date().toISOString(), addedBy: 'leo' }
];

let nextId = 4;

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

  // For demo, we'll just check if password is 'admin123' or 'manager123'
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

// Get transactions (filtered by user role and location)
app.get('/api/transactions', authenticateToken, (req, res) => {
  let filteredTransactions = transactions;

  // Filter based on user role and location
  if (req.user.role === 'manager') {
    filteredTransactions = transactions.filter(t => t.location === req.user.location);
  }
  // Admin sees all transactions

  res.json(filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Add new transaction
app.post('/api/transactions', authenticateToken, (req, res) => {
  const { description, amount, type, location } = req.body;
  
  // Managers can only add transactions to their location
  let transactionLocation = location;
  if (req.user.role === 'manager') {
    transactionLocation = req.user.location;
  }
  
  const transaction = {
    id: nextId++,
    description,
    amount: Number(amount),
    type,
    location: transactionLocation,
    date: new Date().toISOString(),
    addedBy: req.user.username
  };
  
  transactions.push(transaction);
  res.json(transaction);
});

// Health check
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Co404 Finance API with Authentication is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});