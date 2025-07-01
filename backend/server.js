const express = require('express');
const cors = require('cors');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Get all transactions
app.get('/api/transactions', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
  const { description, amount, type, location } = req.body;
  
  db.run(
    'INSERT INTO transactions (description, amount, type, location) VALUES (?, ?, ?, ?)',
    [description, amount, type, location || 'Oaxaca City'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, description, amount, type, location });
    }
  );
});

// Your original hello endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Co404 Finance API!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on http://localhost:${PORT}`);
});