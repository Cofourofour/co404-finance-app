const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'finance.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Create transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      location TEXT DEFAULT 'Oaxaca City'
    )
  `);

  // Insert sample Co404 data
  db.run(`INSERT OR IGNORE INTO transactions (id, description, amount, type, location) VALUES (1, 'Salary - Oaxaca', 3000, 'income', 'Oaxaca City')`);
  db.run(`INSERT OR IGNORE INTO transactions (id, description, amount, type, location) VALUES (2, 'Office Rent', -1200, 'expense', 'Oaxaca City')`);
  db.run(`INSERT OR IGNORE INTO transactions (id, description, amount, type, location) VALUES (3, 'Equipment Purchase', -500, 'expense', 'Medellín')`);
});

module.exports = db;