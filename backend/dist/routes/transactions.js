"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Database_1 = require("../models/Database");
const auth_1 = require("../middleware/auth");
const constants_1 = require("../config/constants");
const router = (0, express_1.Router)();
const convertToUSD = (amount, currency) => {
    return amount / constants_1.EXCHANGE_RATES[currency];
};
const formatCurrency = (amount, currency) => {
    const symbols = { MXN: '$', COP: '$', USD: '$' };
    return `${symbols[currency]}${amount.toLocaleString()} ${currency}`;
};
router.get('/', auth_1.authenticateToken, (req, res) => {
    try {
        const { location } = req.query;
        let whereClause = '';
        let params = [];
        if (req.user.role === 'manager') {
            whereClause = 'WHERE location = ?';
            params = [req.user.location];
        }
        else if (req.user.role === 'volunteer') {
            whereClause = 'WHERE addedBy = ?';
            params = [req.user.username];
        }
        else if (req.user.role === 'admin' && location && location !== 'all') {
            whereClause = 'WHERE location = ?';
            params = [location];
        }
        const transactions = Database_1.DatabaseService.getTransactions(whereClause, params);
        const transactionsWithUSD = transactions.map(t => ({
            ...t,
            amountUSD: convertToUSD(t.amount, t.currency),
            formattedAmount: formatCurrency(t.amount, t.currency)
        }));
        res.json(transactionsWithUSD);
    }
    catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/', auth_1.authenticateToken, (req, res) => {
    try {
        const { description, amount, type, location, category, paymentMethod } = req.body;
        let transactionLocation = location;
        if (req.user.role === 'manager' || req.user.role === 'volunteer') {
            transactionLocation = req.user.location;
        }
        const currency = constants_1.LOCATION_CURRENCY[transactionLocation];
        const activeShift = Database_1.DatabaseService.getActiveShift(req.user.username, transactionLocation);
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
        const insertedTransaction = Database_1.DatabaseService.insertTransaction(transaction);
        const transactionWithUSD = {
            ...insertedTransaction,
            amountUSD: convertToUSD(insertedTransaction.amount, currency),
            formattedAmount: formatCurrency(insertedTransaction.amount, currency)
        };
        res.json(transactionWithUSD);
    }
    catch (error) {
        console.error('Add transaction error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=transactions.js.map