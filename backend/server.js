const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

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
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

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
  }
];

let nextId = 3;

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
    if (!dateStr) return new Date().toISOString();
    
    // Handle different date formats
    const str = dateStr.toString().trim();
    
    // Handle Excel date numbers
    if (!isNaN(str) && str.length > 4) {
      const excelDate = new Date((parseInt(str) - 25569) * 86400 * 1000);
      if (excelDate.getFullYear() > 1900) {
        return excelDate.toISOString();
      }
    }
    
    // Handle MM/DD/YYYY or M/D/YYYY format
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0]);
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900) {
        const date = new Date(year, month - 1, day);
        return date.toISOString();
      }
    }
    
    // Try parsing as standard date string
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) {
      return parsedDate.toISOString();
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
    if (amountStr === null || amountStr === undefined) return 0;
    
    // Convert to string and clean
    const cleanAmount = amountStr.toString()
      .replace(/[$,\s()]/g, '') // Remove $, commas, spaces, parentheses
      .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus signs
    
    if (!cleanAmount || cleanAmount === '-') return 0;
    
    const amount = parseFloat(cleanAmount);
    return isNaN(amount) ? 0 : amount;
  } catch (error) {
    console.error('Amount parsing error:', error);
    return 0;
  }
};

// Helper function to normalize user names
const normalizeUser = (who) => {
  if (!who) return 'unknown';
  
  const whoLower = who.toString().toLowerCase().trim();
  if (whoLower.includes('ivonne') || whoLower.includes('yvonne')) return 'ivonne';
  if (whoLower.includes('santi')) return 'santi';
  if (whoLower.includes('leo')) return 'leo';
  if (whoLower.includes('laurens')) return 'laurens';
  if (whoLower.includes('volunteer')) return 'volunteers';
  return whoLower;
};

// Helper function to normalize payment methods
const normalizePaymentMethod = (method) => {
  if (!method) return 'Cash box';
  
  const methodStr = method.toString().toLowerCase().trim();
  if (methodStr.includes('cash') && methodStr.includes('box')) return 'Cash box';
  if (methodStr.includes('pouch')) return 'Pouch manager';
  if (methodStr.includes('card') && methodStr.includes('co404')) return 'Card CO404';
  if (methodStr.includes('card') && methodStr.includes('manager')) return 'Card manager';
  if (methodStr.includes('laurens') && methodStr.includes('safe')) return 'Laurens safe';
  
  return method.toString().trim() || 'Cash box';
};

// Helper function to validate category
const validateCategory = (category, isIncome) => {
  if (!category) return isIncome ? 'Non-guests' : 'Miscellaneous';
  
  const categoryStr = category.toString().trim();
  const validCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  // Check exact match first
  if (validCategories.includes(categoryStr)) return categoryStr;
  
  // Check partial matches
  const lowerCategory = categoryStr.toLowerCase();
  const match = validCategories.find(cat => 
    cat.toLowerCase().includes(lowerCategory) || 
    lowerCategory.includes(cat.toLowerCase())
  );
  
  return match || (isIncome ? 'Non-guests' : 'Miscellaneous');
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

// EXCEL FILE UPLOAD ENDPOINT
app.post('/api/upload-excel', authenticateToken, upload.single('excelFile'), (req, res) => {
  // Only admins can upload files
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required for file upload' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const importedTransactions = [];
    const errors = [];
    const detailedErrors = [];

    // Skip header row and process data
    jsonData.slice(1).forEach((row, index) => {
      const rowNumber = index + 2; // +2 because we skip header and arrays are 0-indexed
      
      try {
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          return;
        }

        // Expect columns: Date | Who | Payment Method | Category | Description | Amount
        const [dateStr, who, paymentMethod, category, description, amountStr] = row;

        // Validate required fields
        const validationErrors = [];
        if (!dateStr) validationErrors.push('Missing date');
        if (!who) validationErrors.push('Missing who');
        if (!paymentMethod) validationErrors.push('Missing payment method');
        if (!category) validationErrors.push('Missing category');
        if (!description) validationErrors.push('Missing description');
        if (amountStr === undefined || amountStr === null || amountStr === '') validationErrors.push('Missing amount');

        if (validationErrors.length > 0) {
          const errorMsg = `Row ${rowNumber}: ${validationErrors.join(', ')}`;
          errors.push(errorMsg);
          detailedErrors.push({
            row: rowNumber,
            data: row,
            errors: validationErrors,
            success: false
          });
          return;
        }

        // Parse and validate data
        const parsedDate = parseDate(dateStr);
        const parsedAmount = parseAmount(amountStr);
        const normalizedWho = normalizeUser(who);
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
        const currency = LOCATION_CURRENCY[location];

        // Determine type based on amount
        const type = parsedAmount >= 0 ? 'income' : 'expense';
        const validatedCategory = validateCategory(category, type === 'income');

        const transaction = {
          id: nextId++,
          description: description.toString().trim() || 'Imported transaction',
          amount: parsedAmount,
          type,
          category: validatedCategory,
          paymentMethod: normalizedPaymentMethod,
          location,
          currency,
          date: parsedDate,
          addedBy: normalizedWho,
          shift: null
        };

        transactions.push(transaction);
        importedTransactions.push(transaction);
        
        detailedErrors.push({
          row: rowNumber,
          data: row,
          transaction: {
            description: transaction.description,
            amount: formatCurrency(transaction.amount, currency),
            type: transaction.type,
            category: transaction.category,
            paymentMethod: transaction.paymentMethod
          },
          errors: [],
          success: true
        });

      } catch (error) {
        const errorMsg = `Row ${rowNumber}: ${error.message}`;
        errors.push(errorMsg);
        detailedErrors.push({
          row: rowNumber,
          data: row,
          errors: [error.message],
          success: false
        });
      }
    });

    res.json({
      success: true,
      imported: importedTransactions.length,
      errors: errors.length,
      errorDetails: errors,
      totalRows: jsonData.length - 1, // -1 for header
      detailedResults: detailedErrors,
      message: `Successfully imported ${importedTransactions.length} transactions for ${location}`
    });

  } catch (error) {
    console.error('Excel import error:', error);
    res.status(500).json({ 
      error: 'Failed to process Excel file', 
      details: error.message 
    });
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
    shift: null
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

// Clear all transactions (admin only)
app.delete('/api/clear-transactions', authenticateToken, (req, res) => {
  // Only admins can clear all transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    // Clear all transactions
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
  res.json({ message: 'Co404 Finance API with Excel Upload is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});