// =============================================================================
// CO404 BACKEND - USER MANAGEMENT ROUTES
// =============================================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { JWT_SECRET } from '../config/constants';
import { User, CreateUserRequest, FirstTimePasswordSetup } from '../types';

const router = Router();

// Generate temporary token for first-time setup
const generateTempToken = (email: string): string => {
  return jwt.sign({ email, type: 'first_time_setup' }, JWT_SECRET, { expiresIn: '48h' });
};

// Helper function to generate username from email
const generateUsername = (email: string): string => {
  return email.split('@')[0].toLowerCase();
};

// Helper function to check if user has permission to create users
const canCreateUsers = (user: any): boolean => {
  return user.role === 'admin' || user.role === 'manager';
};

// Get all users (Admin only sees all, Manager sees their location)
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const data = DatabaseService.readDatabase();
    let users = data.users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email || user.username, // Fallback for existing users
      firstName: user.firstName || user.name?.split(' ')[0] || 'Unknown',
      lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || '',
      role: user.role,
      location: user.location,
      status: user.status || 'active',
      createdAt: user.createdAt || new Date().toISOString(),
      lastLogin: user.lastLogin,
      isFirstLogin: user.isFirstLogin || false
    }));

    // Filter based on role
    if (req.user.role === 'manager') {
      users = users.filter(user => 
        user.location === req.user.location || user.role === 'admin'
      );
    }

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user (Admin/Manager only)
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!canCreateUsers(req.user)) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const { email, firstName, lastName, role, location, phoneNumber }: CreateUserRequest = req.body;

    // Validation
    if (!email || !firstName || !lastName || !role || !location) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if email already exists
    const data = DatabaseService.readDatabase();
    const existingUser = data.users.find(u => 
      u.email === email || u.username === email
    );

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Managers can only create users for their location
    if (req.user.role === 'manager' && location !== req.user.location) {
      res.status(403).json({ error: 'You can only create users for your location' });
      return;
    }

    // Generate temporary password (they'll set real password on first login)
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Generate temporary token for first-time setup
    const tempToken = generateTempToken(email);

    const newUser: User = {
      id: data.nextUserId++,
      username: generateUsername(email),
      email,
      password: hashedPassword,
      role: role as 'volunteer' | 'manager',
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      location,
      isFirstLogin: true,
      phoneNumber,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      status: 'pending'
    };

    data.users.push(newUser);
    DatabaseService.writeDatabase(data);

    // In a real app, you'd send an email here with the tempToken
    // For demo purposes, we'll return it in the response
    res.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        location: newUser.location,
        status: newUser.status
      },
      tempToken, // In production, this would be sent via email
      tempPassword // In production, this would be sent via email
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// First-time password setup
router.post('/setup-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempToken, newPassword, confirmPassword }: FirstTimePasswordSetup = req.body;

    if (!tempToken || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
      if (decoded.type !== 'first_time_setup') {
        throw new Error('Invalid token type');
      }
    } catch (error) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    // Find user by email
    const data = DatabaseService.readDatabase();
    const userIndex = data.users.findIndex(u => u.email === decoded.email);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = data.users[userIndex];
    if (!user.isFirstLogin) {
      res.status(400).json({ error: 'Password already set up' });
      return;
    }

    // Update user with new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    data.users[userIndex] = {
      ...user,
      password: hashedPassword,
      isFirstLogin: false,
      status: 'active',
      lastLogin: new Date().toISOString()
    };

    DatabaseService.writeDatabase(data);

    // Generate login token
    const loginToken = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        location: user.location 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Password set up successfully',
      token: loginToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Setup password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (Admin/Manager can update users in their scope)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id);
    const { firstName, lastName, phoneNumber, status } = req.body;

    const data = DatabaseService.readDatabase();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const targetUser = data.users[userIndex];

    // Permission checks
    if (req.user.role === 'manager' && targetUser.location !== req.user.location) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Update user
    data.users[userIndex] = {
      ...targetUser,
      firstName: firstName || targetUser.firstName,
      lastName: lastName || targetUser.lastName,
      name: `${firstName || targetUser.firstName} ${lastName || targetUser.lastName}`,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : targetUser.phoneNumber,
      status: status || targetUser.status
    };

    DatabaseService.writeDatabase(data);

    res.json({
      message: 'User updated successfully',
      user: {
        id: data.users[userIndex].id,
        email: data.users[userIndex].email,
        firstName: data.users[userIndex].firstName,
        lastName: data.users[userIndex].lastName,
        role: data.users[userIndex].role,
        location: data.users[userIndex].location,
        status: data.users[userIndex].status
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deactivate user (Admin/Manager only)
router.delete('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (!canCreateUsers(req.user)) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const userId = parseInt(req.params.id);
    const data = DatabaseService.readDatabase();
    const userIndex = data.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const targetUser = data.users[userIndex];

    // Permission checks
    if (req.user.role === 'manager' && targetUser.location !== req.user.location) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Don't allow deleting admin users or self
    if (targetUser.role === 'admin' || targetUser.id === req.user.id) {
      res.status(400).json({ error: 'Cannot deactivate this user' });
      return;
    }

    // Deactivate user instead of deleting
    data.users[userIndex] = {
      ...targetUser,
      status: 'inactive'
    };

    DatabaseService.writeDatabase(data);

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;