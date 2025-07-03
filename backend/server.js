const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';

// JSON File Database setup
const dbPath = path.join(__dirname, 'co404_database.json');

// Initialize JSON database
function initializeDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initialData = {
        users: [
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
        ],
        transactions: [],
        nextUserId: 6,
        nextTransactionId: 1
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      console.log('✅ JSON database initialized');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Helper functions for JSON database
function readDatabase() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Read database error:', error);
    return { users: [], transactions: [], nextUserId: 1, nextTransactionId: 1 };
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Write database error:', error);
  }
}

// Initialize database when server starts
initializeDatabase();

// Initialize JSON database
function initializeDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      const initialData = {
        users: [
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
        ],
        transactions: [],
        shifts: [],
        nextUserId: 6,
        nextTransactionId: 1
        nextShiftId: 1 
      };
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      console.log('✅ JSON database initialized with users');
    } else {
      console.log('✅ JSON database already exists');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}
// Insert default users
function insertDefaultUsers() {
  const defaultUsers = [
    {
      username: 'laurens',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'admin',
      name: 'Laurens',
      location: 'all'
    },
    {
      username: 'santi',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'manager',
      name: 'Santi',
      location: 'San Cristóbal'
    },
    {
      username: 'leo',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'manager',
      name: 'Leo',
      location: 'Medellín'
    },
    {
      username: 'ivonne',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'manager',
      name: 'Ivonne',
      location: 'Oaxaca City'
    },
    {
      username: 'volunteer1',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'volunteer',
      name: 'Alex (Volunteer)',
      location: 'Oaxaca City'
    }
  ];

  // Check if users already exist
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Inserting default users...');
      const stmt = db.prepare("INSERT INTO users (username, password, role, name, location) VALUES (?, ?, ?, ?, ?)");
      
      defaultUsers.forEach(user => {
        stmt.run([user.username, user.password, user.role, user.name, user.location]);
      });
      
      stmt.finalize();
      console.log('Default users inserted');
    }
  });
}

// Insert sample transactions
function insertSampleTransactions() {
  db.get("SELECT COUNT(*) as count FROM transactions", (err, row) => {
    if (err) {
      console.error('Error checking transactions:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Inserting sample transactions...');
      const sampleTransactions = [
        {
          description: 'Private room booking',
          amount: 1800,
          type: 'income',
          category: 'Guest stay',
          paymentMethod: 'Card CO404',
          location: 'Oaxaca City',
          currency: 'MXN',
          date: new Date().toISOString(),
          addedBy: 'ivonne'
        },
        {
          description: 'Monthly rent payment',
          amount: -25000,
          type: 'expense',
          category: 'Rent',
          paymentMethod: 'Card CO404',
          location: 'Oaxaca City',
          currency: 'MXN',
          date: new Date().toISOString(),
          addedBy: 'ivonne'
        }
      ];

      const stmt = db.prepare(`INSERT INTO transactions 
        (description, amount, type, category, paymentMethod, location, currency, date, addedBy, shift) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      sampleTransactions.forEach(t => {
        stmt.run([t.description, t.amount, t.type, t.category, t.paymentMethod, t.location, t.currency, t.date, t.addedBy, null]);
      });
      
      stmt.finalize();
      console.log('Sample transactions inserted');
    }
  });
}

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

// Helper function to parse amount and remove $ signs - IMPROVED
const parseAmount = (amountStr) => {
  try {
    if (amountStr === null || amountStr === undefined) return 0;
    
    // Convert to string and clean - IMPROVED CLEANING
    let cleanAmount = amountStr.toString()
      .replace(/[$,\s()]/g, '') // Remove $, commas, spaces, parentheses
      .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus signs
      .trim();
    
    // Handle edge cases
    if (!cleanAmount || cleanAmount === '-' || cleanAmount === '.') return 0;
    
    // Parse as float and get absolute value (we'll handle sign based on Type column)
    const amount = Math.abs(parseFloat(cleanAmount));
    return isNaN(amount) ? 0 : amount;
  } catch (error) {
    console.error('Amount parsing error for:', amountStr, error);
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

// Database helper functions - JSON VERSION
function getUserById(id) {
  const data = readDatabase();
  return data.users.find(user => user.id === id) || null;
}

function getUserByUsername(username) {
  const data = readDatabase();
  return data.users.find(user => user.username === username) || null;
}

function getTransactions(whereClause = '', params = []) {
  const data = readDatabase();
  let transactions = data.transactions;
  
  // Simple filtering for location and user
  if (whereClause.includes('location = ?') && params[0]) {
    transactions = transactions.filter(t => t.location === params[0]);
  }
  if (whereClause.includes('addedBy = ?') && params[0]) {
    transactions = transactions.filter(t => t.addedBy === params[0]);
  }
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function insertTransaction(transaction) {
  const data = readDatabase();
  const newTransaction = {
    id: data.nextTransactionId++,
    ...transaction,
    created_at: new Date().toISOString()
  };
  data.transactions.push(newTransaction);
  writeDatabase(data);
  return newTransaction;
}
// Shift helper functions
function insertShift(shift) {
  const data = readDatabase();
  const newShift = {
    id: data.nextShiftId++,
    ...shift,
    created_at: new Date().toISOString()
  };
  data.shifts.push(newShift);
  writeDatabase(data);
  return newShift;
}

function updateShift(shiftId, updates) {
  const data = readDatabase();
  const shiftIndex = data.shifts.findIndex(s => s.id === shiftId);
  if (shiftIndex !== -1) {
    data.shifts[shiftIndex] = { ...data.shifts[shiftIndex], ...updates };
    writeDatabase(data);
    return data.shifts[shiftIndex];
  }
  return null;
}

function getActiveShift(username, location) {
  const data = readDatabase();
  return data.shifts.find(s => 
    s.username === username && 
    s.location === location && 
    s.status === 'active'
  );
}

// 🎯 UPDATED EXCEL FILE UPLOAD ENDPOINT - FIXED TYPE COLUMN PARSING
app.post('/api/upload-excel', authenticateToken, upload.single('excelFile'), async (req, res) => {
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

    console.log(`🔄 Starting Excel import for ${location}...`);

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

    console.log(`📊 Processing ${jsonData.length - 1} rows (excluding header)...`);

    // Skip header row and process data
    for (let index = 1; index < jsonData.length; index++) {
      const row = jsonData[index];
      const rowNumber = index + 1;
      
      try {
        // Skip empty rows
        if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
          console.log(`⏭️  Skipping empty row ${rowNumber}`);
          continue;
        }

        // Expected columns: Date | Type | Who | Payment Method | Category | Description | Amount
        const [dateStr, typeStr, who, paymentMethod, category, description, amountStr] = row;

        console.log(`🔍 Processing row ${rowNumber}:`, {
          date: dateStr,
          type: typeStr,
          who: who,
          paymentMethod: paymentMethod,
          category: category,
          description: description,
          amount: amountStr
        });

        // Validate required fields
        const validationErrors = [];
        if (!dateStr) validationErrors.push('Missing date');
        if (!typeStr) validationErrors.push('Missing type'); // Now required!
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
          console.log(`❌ Row ${rowNumber} validation failed:`, validationErrors);
          continue;
        }

        // Parse and validate data
        const parsedDate = parseDate(dateStr);
        const parsedAmount = parseAmount(amountStr);
        const normalizedWho = normalizeUser(who);
        const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
        const currency = LOCATION_CURRENCY[location];

        // 🎯 KEY FIX: Read Type from column B explicitly (case-insensitive)
        const typeFromColumn = typeStr.toString().toLowerCase().trim();
        const isIncome = typeFromColumn === 'income';
        const type = isIncome ? 'income' : 'expense';
        
        // Convert amount: expenses to negative, income to positive
        const finalAmount = isIncome ? Math.abs(parsedAmount) : -Math.abs(parsedAmount);
        
        const validatedCategory = validateCategory(category, isIncome);

        console.log(`✅ Row ${rowNumber} processed:`, {
          type: type,
          amount: finalAmount,
          originalAmount: parsedAmount,
          isIncome: isIncome
        });

        const transaction = {
          description: description.toString().trim() || 'Imported transaction',
          amount: finalAmount,
          type,
          category: validatedCategory,
          paymentMethod: normalizedPaymentMethod,
          location,
          currency,
          date: parsedDate,
          addedBy: normalizedWho,
          shift: null
        };

        // Insert into database
        const insertedTransaction = insertTransaction(transaction);
        importedTransactions.push(insertedTransaction);
        
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
        console.error(`❌ Row ${rowNumber} processing error:`, error);
      }
    }

    console.log(`🎉 Excel import completed! Imported: ${importedTransactions.length}, Errors: ${errors.length}`);

    res.json({
      success: true,
      imported: importedTransactions.length,
      errors: errors.length,
      errorDetails: errors,
      totalRows: jsonData.length - 1, // -1 for header
      detailedResults: detailedErrors,
      message: `Successfully imported ${importedTransactions.length} transactions for ${location}! ✨ Type column parsing fixed 🚀`
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
  
  try {
    const user = getUserByUsername(username);
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = getUserById(req.user.id);
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
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transactions with optional location filter
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { location } = req.query;
    let whereClause = '';
    let params = [];

    // Filter based on user role first
    if (req.user.role === 'manager') {
      whereClause = 'WHERE location = ?';
      params = [req.user.location];
    } else if (req.user.role === 'volunteer') {
      // Volunteers see only their own transactions
      whereClause = 'WHERE addedBy = ?';
      params = [req.user.username];
    } else if (req.user.role === 'admin' && location && location !== 'all') {
      // Admin can filter by specific location
      whereClause = 'WHERE location = ?';
      params = [location];
    }

    const transactions = getTransactions(whereClause, params);

    // Add USD conversion for display
    const transactionsWithUSD = transactions.map(t => ({
      ...t,
      amountUSD: convertToUSD(t.amount, t.currency),
      formattedAmount: formatCurrency(t.amount, t.currency)
    }));

    res.json(transactionsWithUSD);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const { description, amount, type, location, category, paymentMethod } = req.body;
    
    // Determine location and currency
    let transactionLocation = location;
    if (req.user.role === 'manager' || req.user.role === 'volunteer') {
      transactionLocation = req.user.location;
    }
    
    const currency = LOCATION_CURRENCY[transactionLocation];
    
    // Get active shift for linking
    const activeShift = getActiveShift(req.user.username, transactionLocation);
    
    const transaction = {
      description,
      amount: Number(amount),
      type,
      category: category || 'Miscellaneous',
      paymentMethod: paymentMethod || 'Cash box',
      location: transactionLocation,
      currency,
      date: new Date().toISOString(),
      addedBy: req.user.username,
      shift: activeShift ? activeShift.id : null
    };
    
    const insertedTransaction = insertTransaction(transaction);
    
    // Return with USD conversion
    const transactionWithUSD = {
      ...insertedTransaction,
      amountUSD: convertToUSD(insertedTransaction.amount, currency),
      formattedAmount: formatCurrency(insertedTransaction.amount, currency)
    };
    
    res.json(transactionWithUSD);
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Start shift
app.post('/api/shifts/start', authenticateToken, (req, res) => {
  try {
    const { startingCash, shiftType } = req.body;
    
    // Check if user already has an active shift
    const activeShift = getActiveShift(req.user.username, req.user.location);
    if (activeShift) {
      return res.status(400).json({ error: 'You already have an active shift' });
    }
    
    const shift = {
      username: req.user.username,
      location: req.user.location,
      shiftType: shiftType || 'morning', // morning or evening
      startingCash: Number(startingCash),
      status: 'active',
      startTime: new Date().toISOString(),
      endTime: null,
      transactions: [],
      finalCount: null,
      variance: null
    };
    
    const newShift = insertShift(shift);
    res.json(newShift);
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active shift
app.get('/api/shifts/active', authenticateToken, (req, res) => {
  try {
    const activeShift = getActiveShift(req.user.username, req.user.location);
    res.json(activeShift || null);
  } catch (error) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// End shift with cash count
app.post('/api/shifts/end', authenticateToken, (req, res) => {
  try {
    const { cashCount } = req.body; // cashCount = { 1: 5, 2: 10, 5: 2, etc }
    
    const activeShift = getActiveShift(req.user.username, req.user.location);
    if (!activeShift) {
      return res.status(400).json({ error: 'No active shift found' });
    }
    
    // Calculate total from denominations
    const denominations = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    const actualTotal = denominations.reduce((total, denom) => {
      return total + (denom * (cashCount[denom] || 0));
    }, 0);
    
    // Calculate expected total based on shift transactions
    const shiftTransactions = getTransactions('', []).filter(t => 
      t.addedBy === req.user.username && 
      new Date(t.date) >= new Date(activeShift.startTime)
    );
    
    const transactionTotal = shiftTransactions.reduce((sum, t) => sum + t.amount, 0);
    const expectedTotal = activeShift.startingCash + transactionTotal;
    const variance = actualTotal - expectedTotal;
    
    // Update shift
    const updatedShift = updateShift(activeShift.id, {
      status: 'completed',
      endTime: new Date().toISOString(),
      finalCount: {
        denominations: cashCount,
        total: actualTotal
      },
      expectedTotal,
      variance,
      transactions: shiftTransactions.map(t => t.id)
    });
    
    res.json({
      shift: updatedShift,
      summary: {
        startingCash: activeShift.startingCash,
        transactionTotal,
        expectedTotal,
        actualTotal,
        variance,
        transactionCount: shiftTransactions.length
      }
    });
  } catch (error) {
    console.error('End shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get location summary (for admin dashboard)
app.get('/api/location-summary', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const locationSummary = [];
    
    for (const location of ['San Cristóbal', 'Oaxaca City', 'Medellín']) {
      const transactions = getTransactions('WHERE location = ?', [location]);
      const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0);
      const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + convertToUSD(t.amount, t.currency), 0));
      
      locationSummary.push({
        name: location,
        currency: LOCATION_CURRENCY[location],
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length
      });
    }

    res.json(locationSummary);
  } catch (error) {
    console.error('Location summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Get monthly financial data for graphs
app.get('/api/monthly-data', authenticateToken, async (req, res) => {
  try {
    const { months = 12, location } = req.query;
    
    let whereClause = '';
    let params = [];
    
    // Filter based on user role
    if (req.user.role === 'manager') {
      whereClause = 'WHERE location = ?';
      params = [req.user.location];
    } else if (req.user.role === 'volunteer') {
      whereClause = 'WHERE addedBy = ?';
      params = [req.user.username];
    } else if (req.user.role === 'admin' && location && location !== 'all') {
      whereClause = 'WHERE location = ?';
      params = [location];
    }
    
    // Get transactions from the database
    const transactions = getTransactions(whereClause, params);
    
    // Group transactions by month
    const monthlyData = {};
    const currentDate = new Date();
    
    // Initialize the last N months
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      monthlyData[monthKey] = {
        month: monthLabel,
        date: monthKey,
        income: 0,
        expenses: 0,
        net: 0,
        transactionCount: 0
      };
    }
    
    // Process transactions
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData[monthKey]) {
        const amountUSD = convertToUSD(transaction.amount, transaction.currency);
        
        if (transaction.amount > 0) {
          monthlyData[monthKey].income += amountUSD;
        } else {
          monthlyData[monthKey].expenses += Math.abs(amountUSD);
        }
        
        monthlyData[monthKey].transactionCount++;
      }
    });
    
    // Calculate net for each month
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].net = monthlyData[key].income - monthlyData[key].expenses;
    });
    
    // Convert to array and sort by date
    const result = Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
    
    res.json(result);
  } catch (error) {
    console.error('Monthly data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all transactions (admin only)
app.delete('/api/clear-transactions', authenticateToken, async (req, res) => {
  // Only admins can clear all transactions
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

try {
    const data = readDatabase();
    data.transactions = [];
    data.nextTransactionId = 1;
    writeDatabase(data);
    
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
  res.json({ message: 'Co404 Finance API with Excel Upload and Database is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});