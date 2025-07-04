"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Database_1 = require("../models/Database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/start', auth_1.authenticateToken, (req, res) => {
    try {
        const { startingCash, shiftType } = req.body;
        const activeShift = Database_1.DatabaseService.getActiveShift(req.user.username, req.user.location);
        if (activeShift) {
            res.status(400).json({ error: 'You already have an active shift' });
            return;
        }
        const shift = {
            username: req.user.username,
            location: req.user.location,
            shiftType: shiftType || 'morning',
            startingCash: Number(startingCash),
            status: 'active',
            startTime: new Date().toISOString(),
            endTime: null,
            transactions: [],
            finalCount: null,
            variance: undefined
        };
        const newShift = Database_1.DatabaseService.insertShift(shift);
        res.json(newShift);
    }
    catch (error) {
        console.error('Start shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/active', auth_1.authenticateToken, (req, res) => {
    try {
        const activeShift = Database_1.DatabaseService.getActiveShift(req.user.username, req.user.location);
        res.json(activeShift || null);
    }
    catch (error) {
        console.error('Get active shift error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=shifts.js.map