const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (will reset when server restarts, but works for demo)
let transactions = [
  { id: 1, description: 'Salary - Oaxaca', amount: 3000, type: 'income', location: 'Oaxaca City', date: new Date().toISOString() },
  { id: 2, description: 'Office Rent', amount: -1200, type: 'expense', location: 'Oaxaca City', date: new Date().toISOString() },
  { id: 3, description: 'Equipment Purchase', amount: -500, type: 'expense', location: 'Medellín', date: new Date().toISOString() }
];

let nextId = 4;

// Get all transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// Add new transaction
app.post('/api/transactions', (req, res) => {
  const { description, amount, type, location } = req.body;
  
  const transaction = {
    id: nextId++,
    description,
    amount: Number(amount),
    type,
    location: location || 'Oaxaca City',
    date: new Date().toISOString()
  };
  
  transactions.push(transaction);
  res.json(transaction);
});

// Health check
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Co404 Finance API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Co404 Finance Server running on port ${PORT}`);
});