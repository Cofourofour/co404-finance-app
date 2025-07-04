// =============================================================================
// CO404 BACKEND - USER MANAGEMENT ROUTES
// =============================================================================

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../models/Database';
import { authenticateToken } from '../middleware/auth';
import { JWT_SECRET } from '../config/constants';
import { User } from '../types';

const router = Router();

// Extended User interface for new user management features
interface ExtendedUser extends User {
  email?: string;
  firstName?: string;
  lastName?: string;
  isFirstLogin?: boolean;
  phoneNumber?: string;
  createdAt?: string;
  createdBy?: number;
  status?: 'active' | 'pending' | 'inactive';
  lastLogin?: string;
}

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'volunteer' | 'manager';
  location: string;
  phoneNumber?: string;
}

interface FirstTimePasswordSetup {
  tempToken: string;
  newPassword: string;
  confirmPassword: string;
}

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

// Get all users (Admin sees all, Manager sees their location)
router.get('/', authenticateToken, (req: Request, res: Response): void => {
  try {
    const data = DatabaseService.readDatabase();
    let users = data.users.map(user => {
      const extUser = user as ExtendedUser;
      return {
        id: extUser.id,
        username: extUser.username,
        email: extUser.email || extUser.username, // Fallback for existing users
        firstName: extUser.firstName || extUser.name?.split(' ')[0] || 'Unknown',
        lastName: extUser.lastName || extUser.name?.split(' ').slice(1).join(' ') || '',
        role: extUser.role,
        location: extUser.location,
        status: extUser.status || 'active',
        createdAt: extUser.createdAt || new Date().toISOString(),
        lastLogin: extUser.lastLogin,
        isFirstLogin: extUser.isFirstLogin || false
      };
    });

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
    const existingUser = data.users.find(u => {
      const extU = u as ExtendedUser;
      return extU.email === email || u.username === email;
    });

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

    const newUser: ExtendedUser = {
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

    data.users.push(newUser as User);
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
    const userIndex = data.users.findIndex(u => {
      const extU = u as ExtendedUser;
      return extU.email === decoded.email;
    });

    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = data.users[userIndex] as ExtendedUser;
    if (!user.isFirstLogin) {
      res.status(400).json({ error: 'Password already set up' });
      return;
    }

    // Update user with new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser: ExtendedUser = {
      ...user,
      password: hashedPassword,
      isFirstLogin: false,
      status: 'active',
      lastLogin: new Date().toISOString()
    };

    data.users[userIndex] = updatedUser as User;
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

    const targetUser = data.users[userIndex] as ExtendedUser;

    // Permission checks
    if (req.user.role === 'manager' && targetUser.location !== req.user.location) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    // Update user
    const updatedUser: ExtendedUser = {
      ...targetUser,
      firstName: firstName || targetUser.firstName,
      lastName: lastName || targetUser.lastName,
      name: `${firstName || targetUser.firstName} ${lastName || targetUser.lastName}`,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : targetUser.phoneNumber,
      status: status || targetUser.status
    };

    data.users[userIndex] = updatedUser as User;
    DatabaseService.writeDatabase(data);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        location: updatedUser.location,
        status: updatedUser.status
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

    const targetUser = data.users[userIndex] as ExtendedUser;

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
    const deactivatedUser: ExtendedUser = {
      ...targetUser,
      status: 'inactive'
    };

    data.users[userIndex] = deactivatedUser as User;
    DatabaseService.writeDatabase(data);

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by ID (for user details view)
router.get('/:id', authenticateToken, (req: Request, res: Response): void => {
  try {
    const userId = parseInt(req.params.id);
    const user = DatabaseService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const extUser = user as ExtendedUser;

    // Permission checks
    if (req.user.role === 'manager' && extUser.location !== req.user.location && extUser.role !== 'admin') {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    res.json({
      id: extUser.id,
      username: extUser.username,
      email: extUser.email || extUser.username,
      firstName: extUser.firstName || extUser.name?.split(' ')[0] || 'Unknown',
      lastName: extUser.lastName || extUser.name?.split(' ').slice(1).join(' ') || '',
      role: extUser.role,
      location: extUser.location,
      status: extUser.status || 'active',
      phoneNumber: extUser.phoneNumber,
      createdAt: extUser.createdAt,
      lastLogin: extUser.lastLogin,
      isFirstLogin: extUser.isFirstLogin || false
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send invitation email (placeholder - would integrate with email service)
router.post('/:id/send-invitation', authenticateToken, (req: Request, res: Response): void => {
  try {
    if (!canCreateUsers(req.user)) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    const userId = parseInt(req.params.id);
    const user = DatabaseService.getUserById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const extUser = user as ExtendedUser;

    // Permission checks
    if (req.user.role === 'manager' && extUser.location !== req.user.location) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    if (extUser.status !== 'pending') {
      res.status(400).json({ error: 'User is not in pending status' });
      return;
    }

    // Generate new temp token
    const tempToken = generateTempToken(extUser.email || extUser.username);

    // In production, this would send an actual email
    // For demo, we'll just return the token
    res.json({
      message: 'Invitation sent successfully',
      tempToken, // In production, this would be sent via email
      email: extUser.email || extUser.username
    });

  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;