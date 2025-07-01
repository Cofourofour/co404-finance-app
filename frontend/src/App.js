import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    location: 'Oaxaca City'
  });

  // Load transactions from database when app starts
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/transactions');
      const data = await response.json();
      setTransactions(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    if (newTransaction.description && newTransaction.amount) {
      try {
        const response = await fetch('http://localhost:5000/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: newTransaction.description,
            amount: newTransaction.type === 'expense' ? -Math.abs(Number(newTransaction.amount)) : Number(newTransaction.amount),
            type: newTransaction.type,
            location: newTransaction.location
          }),
        });
        
        if (response.ok) {
          fetchTransactions();
          setNewTransaction({ description: '', amount: '', type: 'expense', location: 'Oaxaca City' });
        }
      } catch (error) {
        console.error('Error adding transaction:', error);
      }
    }
  };

  // Analytics calculations
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  const totalBalance = totalIncome - totalExpenses;

  // Location breakdown
  const locationData = ['Oaxaca City', 'San Cristóbal', 'Medellín'].map(location => {
    const locationTransactions = transactions.filter(t => t.location === location);
    const income = locationTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = Math.abs(locationTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    return {
      name: location,
      income,
      expenses,
      net: income - expenses
    };
  });

  // Income vs Expenses pie chart data
  const pieData = [
    { name: 'Income', value: totalIncome, color: '#C58C72' },
    { name: 'Expenses', value: totalExpenses, color: '#B37775' }
  ];

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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Co404 Finance Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value income">${totalIncome.toFixed(2)}</div>
            <div>Total Income</div>
          </div>
          <div className="stat-card">
            <div className="stat-value expense">${totalExpenses.toFixed(2)}</div>
            <div>Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value balance">${totalBalance.toFixed(2)}</div>
            <div>Net Balance</div>
          </div>
        </div>

        {/* Charts */}
        <div className="analytics">
          <h3>Financial Analytics</h3>
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
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Location Performance Bar Chart */}
            <div className="chart-container">
              <h4>Performance by Location</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#C58C72" name="Income" />
                  <Bar dataKey="expenses" fill="#B37775" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="add-transaction">
          <h3>Add New Transaction</h3>
          <form onSubmit={addTransaction}>
            <input
              type="text"
              placeholder="Description"
              value={newTransaction.description}
              onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
            />
            <input
              type="number"
              placeholder="Amount"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
            />
            <select
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select
              value={newTransaction.location}
              onChange={(e) => setNewTransaction({...newTransaction, location: e.target.value})}
            >
              <option value="Oaxaca City">Oaxaca City</option>
              <option value="San Cristóbal">San Cristóbal</option>
              <option value="Medellín">Medellín</option>
            </select>
            <button type="submit">Add Transaction</button>
          </form>
        </div>

        {/* Recent Transactions */}
        <div className="transactions">
          <h3>Recent Transactions</h3>
          {transactions.map(transaction => (
            <div key={transaction.id} className={`transaction ${transaction.type}`}>
              <div>
                <span>{transaction.description}</span>
                <small style={{display: 'block', opacity: 0.8}}>{transaction.location}</small>
              </div>
              <span>${transaction.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;