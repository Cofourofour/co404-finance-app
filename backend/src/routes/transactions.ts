import { Router, Request, Response } from 'express';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { EXCHANGE_RATES, LOCATION_CURRENCY } from '../config/constants';
import { Transaction, TransactionWithUSD } from '../types';

const router = Router();

// Helper functions
const convertToUSD = (amount: number, currency: string): number => {
  return amount / (EXCHANGE_RATES as any)[currency];
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols = { MXN: '$', COP: '$', USD: '$' };
  return `${(symbols as any)[currency]}${amount.toLocaleString()} ${currency}`;
};

// Get transactions with optional location filter
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { location } = req.query;
    let whereClause = '';
    let params: any[] = [];

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
      params = [location as string];
    }

    const transactions = DatabaseService.getTransactions(whereClause, params);

    // Add USD conversion for display
    const transactionsWithUSD: TransactionWithUSD[] = transactions.map(t => ({
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
router.post('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { description, amount, type, location, category, paymentMethod } = req.body;
    
    // Determine location and currency
    let transactionLocation = location;
    if (req.user.role === 'manager' || req.user.role === 'volunteer') {
      transactionLocation = req.user.location;
    }
    
    const currency = (LOCATION_CURRENCY as any)[transactionLocation];
    
    // Get active shift for linking
    const activeShift = DatabaseService.getActiveShift(req.user.username, transactionLocation);
    
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
    
    const insertedTransaction = DatabaseService.insertTransaction(transaction);
    
    // Return with USD conversion
    const transactionWithUSD: TransactionWithUSD = {
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

export default router;