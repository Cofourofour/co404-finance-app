import { Router, Request, Response } from 'express';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { CASH_DENOMINATIONS } from '../config/constants';

const router = Router();

// Start shift
router.post('/start', authenticateToken, (req: Request, res: Response): void => {
  try {
    const { startingCash, shiftType } = req.body;
    
    // Check if user already has an active shift
    const activeShift = DatabaseService.getActiveShift(req.user.username, req.user.location);
    if (activeShift) {
      res.status(400).json({ error: 'You already have an active shift' });
      return;
    }
    
    const shift = {
      username: req.user.username,
      location: req.user.location,
      shiftType: shiftType || 'morning',
      startingCash: Number(startingCash),
      status: 'active' as const,
      startTime: new Date().toISOString(),
      endTime: null,
      transactions: [],
      finalCount: null,
      variance: undefined
    };
    
    const newShift = DatabaseService.insertShift(shift);
    res.json(newShift);
  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active shift
router.get('/active', authenticateToken, (req: Request, res: Response): void => {
  try {
    const activeShift = DatabaseService.getActiveShift(req.user.username, req.user.location);
    res.json(activeShift || null);
  } catch (error) {
    console.error('Get active shift error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;