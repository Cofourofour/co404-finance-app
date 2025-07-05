import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DatabaseService } from '../models/Database';

const router = Router();

// GET /api/business-data
router.get('/business-data', authenticateToken, (req: Request, res: Response) => {
  try {
    // You can customize these categories as needed
    const expenseCategories = [
      'Supplies', 'Rent', 'Utilities', 'Salaries', 'Travel', 'Food', 'Miscellaneous'
    ];
    const incomeCategories = [
      'Sales', 'Donations', 'Grants', 'Other'
    ];
    const paymentMethods = [
      'Cash box', 'Bank transfer', 'Credit card', 'Other'
    ];
    res.json({ expenseCategories, incomeCategories, paymentMethods });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load business data' });
  }
});

// GET /api/location-summary
router.get('/location-summary', authenticateToken, (req: Request, res: Response) => {
  try {
    const data = DatabaseService.readDatabase();
    const locations = ['Oaxaca City', 'San Cristóbal', 'Medellín'];
    const summary = locations.map(location => {
      const transactions = data.transactions.filter((t: any) => t.location === location);
      const totalIncome = transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const totalExpenses = transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
      const netProfit = totalIncome - totalExpenses;
      return { location, totalIncome, totalExpenses, netProfit };
    });
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load location summary' });
  }
});

export default router;
