"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Database_1 = require("../models/Database");
const auth_1 = require("../middleware/auth");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const generateTempToken = (email) => {
    return jsonwebtoken_1.default.sign({ email, type: 'first_time_setup' }, constants_1.JWT_SECRET, { expiresIn: '48h' });
};
const generateUsername = (email) => {
    return email.split('@')[0].toLowerCase();
};
const canCreateUsers = (user) => {
    return user.role === 'admin' || user.role === 'manager';
};
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        const data = Database_1.DatabaseService.readDatabase();
        let users = data.users.map(user => {
            const extUser = user;
            return {
                id: extUser.id,
                username: extUser.username,
                email: extUser.email || extUser.username,
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
        if (req.user.role === 'manager') {
            users = users.filter(user => user.location === req.user.location || user.role === 'admin');
        }
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        if (!canCreateUsers(req.user)) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        const { email, firstName, lastName, role, location, phoneNumber } = req.body;
        if (!email || !firstName || !lastName || !role || !location) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }
        const data = Database_1.DatabaseService.readDatabase();
        const existingUser = data.users.find(u => {
            const extU = u;
            return extU.email === email || u.username === email;
        });
        if (existingUser) {
            res.status(400).json({ error: 'User with this email already exists' });
            return;
        }
        if (req.user.role === 'manager' && location !== req.user.location) {
            res.status(403).json({ error: 'You can only create users for your location' });
            return;
        }
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcryptjs_1.default.hash(tempPassword, 10);
        const tempToken = generateTempToken(email);
        const newUser = {
            id: data.nextUserId++,
            username: generateUsername(email),
            email,
            password: hashedPassword,
            role: role,
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
        Database_1.DatabaseService.writeDatabase(data);
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
            tempToken,
            tempPassword
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/setup-password', async (req, res) => {
    try {
        const { tempToken, newPassword, confirmPassword } = req.body;
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
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, constants_1.JWT_SECRET);
            if (decoded.type !== 'first_time_setup') {
                throw new Error('Invalid token type');
            }
        }
        catch (error) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }
        const data = Database_1.DatabaseService.readDatabase();
        const userIndex = data.users.findIndex(u => {
            const extU = u;
            return extU.email === decoded.email;
        });
        if (userIndex === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const user = data.users[userIndex];
        if (!user.isFirstLogin) {
            res.status(400).json({ error: 'Password already set up' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const updatedUser = {
            ...user,
            password: hashedPassword,
            isFirstLogin: false,
            status: 'active',
            lastLogin: new Date().toISOString()
        };
        data.users[userIndex] = updatedUser;
        Database_1.DatabaseService.writeDatabase(data);
        const loginToken = jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            role: user.role,
            location: user.location
        }, constants_1.JWT_SECRET, { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('Setup password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { firstName, lastName, phoneNumber, status } = req.body;
        const data = Database_1.DatabaseService.readDatabase();
        const userIndex = data.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const targetUser = data.users[userIndex];
        if (req.user.role === 'manager' && targetUser.location !== req.user.location) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        const updatedUser = {
            ...targetUser,
            firstName: firstName || targetUser.firstName,
            lastName: lastName || targetUser.lastName,
            name: `${firstName || targetUser.firstName} ${lastName || targetUser.lastName}`,
            phoneNumber: phoneNumber !== undefined ? phoneNumber : targetUser.phoneNumber,
            status: status || targetUser.status
        };
        data.users[userIndex] = updatedUser;
        Database_1.DatabaseService.writeDatabase(data);
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
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/:id', auth_1.authenticateToken, (req, res) => {
    try {
        if (!canCreateUsers(req.user)) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        const userId = parseInt(req.params.id);
        const data = Database_1.DatabaseService.readDatabase();
        const userIndex = data.users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const targetUser = data.users[userIndex];
        if (req.user.role === 'manager' && targetUser.location !== req.user.location) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        if (targetUser.role === 'admin' || targetUser.id === req.user.id) {
            res.status(400).json({ error: 'Cannot deactivate this user' });
            return;
        }
        const deactivatedUser = {
            ...targetUser,
            status: 'inactive'
        };
        data.users[userIndex] = deactivatedUser;
        Database_1.DatabaseService.writeDatabase(data);
        res.json({ message: 'User deactivated successfully' });
    }
    catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:id', auth_1.authenticateToken, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = Database_1.DatabaseService.getUserById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const extUser = user;
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/:id/send-invitation', auth_1.authenticateToken, (req, res) => {
    try {
        if (!canCreateUsers(req.user)) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        const userId = parseInt(req.params.id);
        const user = Database_1.DatabaseService.getUserById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const extUser = user;
        if (req.user.role === 'manager' && extUser.location !== req.user.location) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        if (extUser.status !== 'pending') {
            res.status(400).json({ error: 'User is not in pending status' });
            return;
        }
        const tempToken = generateTempToken(extUser.email || extUser.username);
        res.json({
            message: 'Invitation sent successfully',
            tempToken,
            email: extUser.email || extUser.username
        });
    }
    catch (error) {
        console.error('Send invitation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map