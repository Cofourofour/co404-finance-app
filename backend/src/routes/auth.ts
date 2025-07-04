import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { JWT_SECRET } from '../config/constants';
import { User } from '../types';

const router = Router();

// Login endpoint
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  
  try {
    const user: User | null = DatabaseService.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = password === 'password';
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
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
router.get('/me', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user: User | null = DatabaseService.getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
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

export default router;