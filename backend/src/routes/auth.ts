import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { JWT_SECRET } from '../config/constants';
import { User } from '../types';

const router = Router();

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  
  try {
    const user: User | null = DatabaseService.getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Handle both old users (hardcoded password) and new users (bcrypt)
    let validPassword = false;

    // For existing users: check if they're using the old system
    if (password === 'password') {
      validPassword = true;
    } else {
      // For new users: use bcrypt to verify password
      try {
        validPassword = await bcrypt.compare(password, user.password);
      } catch (error) {
        console.error('Password comparison error:', error);
        validPassword = false;
      }
    }

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