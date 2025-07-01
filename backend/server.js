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

// Co404 Business Categories
const EXPENSE_CATEGORIES = [
  'Cleaning supplies', 'Coffee', 'Drinking water', 'General supplies', 
  'Improvements', 'Internet', 'Laundry', 'Miscellaneous', 'Rent', 
  'Utilities', 'Volunteer activities', 'Volunteer breakfast', 
  'Day-to-day expenses', 'Family dinner', 'Beers', 'Market', 
  'Software', 'Expansion', 'Taxes', 'Maintenance', 'Wages', 'Airbnb'
];

const INCOME_CATEGORIES = [
  'Guest stay', 'Beer', 'Volunteer activities', 'Non-guests'
];

// Co404 Payment Methods by Location
const PAYMENT_METHODS = {
  'San Cristóbal': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Oaxaca City': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Medellín': ['Cash box', 'Pouch manager', 'Card manager'], // No Card CO404 in Colombia
  'all': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404', 'Laurens safe']
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for bulk imports
app.use(express.text({ limit: '50mb' })); // Support for text data

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
  },
  {
    id: 5,
    username: 'volunteer1',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'volunteer',
    name: 'Alex (Volunteer)',
    location: 'Oaxaca City'
  }
];

// Enhanced transactions with Co404 structure
let transactions = [
  { 
    id: 1, 
    description: 'Private room booking', 
    amount: 1800, 
    type: 'income', 
    category: 'Guest stay',
    paymentMethod: 'Card CO404',
    location: 'Oaxaca City', 
    currency: 'MXN', 
    date: new Date().toISOString(), 
    addedBy: 'ivonne',
    shift: null
  },
  { 
    id: 2, 
    description: 'Monthly rent payment', 
    amount: -25000, 
    type: 'expense', 
    category: 'Rent',
    paymentMethod: 'Card CO404',
    location: 'Oaxaca City', 
    currency: 'MXN', 
    date: new Date().toISOString(), 
    addedBy: 'ivonne',
    shift: null
  },
  { 
    id: 3, 
    description: 'Coffee beans for guests', 
    amount: -240000, 
    type: 'expense', 
    category: 'Coffee',
    paymentMethod: 'Cash box',
    location: 'Medellín', 
    currency: 'COP', 
    date: new Date().toISOString(), 
    addedBy: 'leo',
    shift: null
  },
  { 
    id: 4, 
    description: 'Dorm bed revenue', 
    amount: 400000, 
    type: 'income', 
    category: 'Guest stay',
    paymentMethod: 'Cash box',
    location: 'Medellín', 
    currency: 'COP', 
    date: new Date().toISOString(), 
    addedBy: 'leo',
    shift: null
  },
  { 
    id: 5, 
    description: 'Beer sales to guests', 
    amount: 320, 
    type: 'income', 
    category: 'Beer',
    paymentMethod: 'Pouch manager',
    location: 'San Cristóbal', 
    currency: 'MXN', 
    date: new Date().toISOString(), 
    addedBy: 'santi',
    shift: null
  },
  { 
    id: 6, 
    description: 'Cleaning supplies purchase', 
    amount: -180, 
    type: 'expense', 
    category: 'Cleaning supplies',
    paymentMethod: 'Cash box',
    location: 'San Cristóbal', 
    currency: 'MXN', 
    date: new Date().toISOString(), 
    addedBy: 'santi',
    shift: null
  }
];

let nextId = 7;

// Helper functions
const convertToUSD = (amount, currency) => {
  return amount / EXCHANGE_RATES[currency];
};

const formatCurrency = (amount, currency) => {
  const symbols = { MXN: '$', COP: '$', USD: '$' };
  return `${symbols[currency]}${amount.toLocaleString()} ${currency}`;
};

// Helper function to parse date from MM/DD/YYYY format
const parseDate = (dateStr) => {
  try {
    // Handle MM/DD/YYYY or M/D/YYYY format
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      // Create date in ISO format
      const date = new Date(year, month - 1, day);
      return date.toISOString();
    }
    return new Date().toISOString(); // Fallback to current date
  } catch (error) {
    console.error('Date parsing error:', error);
    return new Date().toISOString();
  }
};

// Helper function to parse amount and remove $ signs
const parseAmount = (amountStr) => {
  try {
    // Remove $ signs, commas, and spaces
    const cleanAmount = amountStr.toString().replace(/[$,\s]/g, '');
    return parseFloat(cleanAmount);
  } catch (error) {
    console.error('Amount parsing error:', error);
    return 0;
  }
};

// Helper function to normalize user names
const normalizeUser = (who) => {
  const whoLower = who.toLowerCase().trim();
  if (whoLower.includes('ivonne') || whoLower.includes('yvonne')) return 'ivonne';
  if (whoLower.includes('santi')) return 'santi';
  if (whoLower.includes('leo')) return 'leo';
  if (whoLower.includes('laurens')) return 'laurens';
  if (whoLower.includes('volunteer')) return 'volunteers';
  return whoLower;
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

// BULK IMPORT ENDPOINT
app.post('/api/bulk-import', authenticateToken, (req, res) => {
  // Only admins can bulk import
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for bulk import' });
  }

  try {
    const { data, location } = req.body;
    
    if (!data || !location) {
      return res.status(400).json({ error: 'Data and location are required' });
    }

    const lines = data.trim().split('\n');
    const importedTransactions = [];
    const errors = [];

    lines.forEach((line, index) => {
      try {
        // Skip empty lines
        if (!line.trim()) return;

        // Split by | or tab, and clean up
        const parts = line.split(/[|\t]/).map(part => part.trim());
        
        if (parts.length < 6) {
          errors.push(`Line ${index + 1}: Insufficient data - need at least 6 columns`);
          return;
        }

        const [dateStr, who, paymentMethod, category, description, amountStr] = parts;

        // Parse and validate data
        const parsedDate = parseDate(dateStr);
        const parsedAmount = parseAmount(amountStr);
        const normalizedWho = normalizeUser(who);
        const currency = LOCATION_CURRENCY[location];

        // Determine type based on amount
        const type = parsedAmount >= 0 ? 'income' : 'expense';

        const transaction = {
          id: nextId++,
          description: description || 'Imported transaction',
          amount: parsedAmount,
          type,
          category: category || 'Miscellaneous',
          paymentMethod: paymentMethod || 'Cash box',
          location,
          currency,
          date: parsedDate,
          addedBy: normalizedWho,
          shift: null
        };

        transactions.push(transaction);
        importedTransactions.push(transaction);

      } catch (error) {
        errors.push(`Line ${index + 1}: ${error.message}`);
      }
    });

    res.json({
      success: true,
      imported: importedTransactions.length,
      errors: errors.length,
      errorDetails: errors,
      message: `Successfully imported ${importedTransactions.length} transactions for ${location}`
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to process bulk import' });
  }
});

// Get business data (categories, payment methods)
app.get('/api/business-data', authenticateToken, (req, res) => {
  const userLocation = req.user.location;
  const paymentMethods = PAYMENT_METHODS[userLocation] || PAYMENT_METHODS['all'];
  
  res.json({
    expenseCategories: EXPENSE_CATEGORIES,
    incomeCategories: INCOME_CATEGORIES,
    paymentMethods: paymentMethods,
    locations: ['San Cristóbal', 'Oaxaca City', 'Medellín'],
    currencies: LOCATION_CURRENCY
  });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = password === 'admin123' || password === 'manager123' || password === 'volunteer123';
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
  const { location } = req.query;
  let filteredTransactions = transactions;

  // Filter based on user role first
  if (req.user.role === 'manager') {
    filteredTransactions = transactions.filter(t => t.location === req.user.location);
  } else if (req.user.role === 'volunteer') {
    // Volunteers see only their own transactions
    filteredTransactions = transactions.filter(t => t.addedBy === req.user.username);
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
  const { description, amount, type, location, category, paymentMethod } = req.body;
  
  // Determine location and currency
  let transactionLocation = location;
  if (req.user.role === 'manager' || req.user.role === 'volunteer') {
    transactionLocation = req.user.location;
  }
  
  const currency = LOCATION_CURRENCY[transactionLocation];
  
  const transaction = {
    id: nextId++,
    description,
    amount: Number(amount),
    type,
    category: category || 'Miscellaneous',
    paymentMethod: paymentMethod || 'Cash box',
    location: transactionLocation,
    currency,
    date: new Date().toISOString(),
    addedBy: req.user.username,
    shift: null // Will add shift tracking later
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

// Get category breakdown
app.get('/api/category-breakdown', authenticateToken, (req, res) => {
  const { location } = req.query;
  let filteredTransactions = transactions;

  // Apply same filtering logic as transactions
  if (req.user.role === 'manager') {
    filteredTransactions = transactions.filter(t => t.location === req.user.location);
  } else if (req.user.role === 'admin' && location && location !== 'all') {
    filteredTransactions = transactions.filter(t => t.location === location);
  }

  // Group by category
  const categoryBreakdown = {};
  filteredTransactions.forEach(t => {
    if (!categoryBreakdown[t.category]) {
      categoryBreakdown[t.category] = { income: 0, expenses: 0, count: 0 };
    }
    
    if (t.amount > 0) {
      categoryBreakdown[t.category].income += convertToUSD(t.amount, t.currency);
    } else {
      categoryBreakdown[t.category].expenses += Math.abs(convertToUSD(t.amount, t.currency));
    }
    categoryBreakdown[t.category].count++;
  });

  res.json(categoryBreakdown);
});
// Clear all transactions (admin only)
app.delete('/api/clear-transactions', authenticateToken, (req, res) => {
  // Only admins can clear all transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Keep only the first 2 sample transactions or clear completely
    transactions = [];
    nextId = 1;
    
    res.json({
      success: true,
      message: 'All transactions cleared successfully'
    });
  } catch (error) {
    console.error('Clear transactions error:', error);
    res.status(500).json({ error: 'Failed to clear transactions' });
  }
});
// Health check
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Co404 Finance API with Bulk Import is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});