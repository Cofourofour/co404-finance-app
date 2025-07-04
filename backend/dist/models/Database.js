"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(__dirname, '../../co404_database.json');
class DatabaseService {
    static readDatabase() {
        try {
            const data = fs_1.default.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            console.error('Read database error:', error);
            return {
                users: [],
                transactions: [],
                shifts: [],
                nextUserId: 1,
                nextTransactionId: 1,
                nextShiftId: 1
            };
        }
    }
    static writeDatabase(data) {
        try {
            fs_1.default.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Write database error:', error);
        }
    }
    static getUserById(id) {
        const data = this.readDatabase();
        return data.users.find(user => user.id === id) || null;
    }
    static getUserByUsername(username) {
        const data = this.readDatabase();
        return data.users.find(user => user.username === username) || null;
    }
    static getTransactions(whereClause = '', params = []) {
        const data = this.readDatabase();
        let transactions = data.transactions;
        if (whereClause.includes('location = ?') && params[0]) {
            transactions = transactions.filter(t => t.location === params[0]);
        }
        if (whereClause.includes('addedBy = ?') && params[0]) {
            transactions = transactions.filter(t => t.addedBy === params[0]);
        }
        return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    static insertTransaction(transaction) {
        const data = this.readDatabase();
        const newTransaction = {
            id: data.nextTransactionId++,
            ...transaction,
            created_at: new Date().toISOString()
        };
        data.transactions.push(newTransaction);
        this.writeDatabase(data);
        return newTransaction;
    }
    static insertShift(shift) {
        const data = this.readDatabase();
        if (!data.shifts) {
            data.shifts = [];
            data.nextShiftId = 1;
        }
        const newShift = {
            id: data.nextShiftId++,
            ...shift,
            created_at: new Date().toISOString()
        };
        data.shifts.push(newShift);
        this.writeDatabase(data);
        return newShift;
    }
    static getActiveShift(username, location) {
        const data = this.readDatabase();
        if (!data.shifts) {
            data.shifts = [];
            data.nextShiftId = 1;
            this.writeDatabase(data);
        }
        return data.shifts.find(s => s.username === username &&
            s.location === location &&
            s.status === 'active') || null;
    }
    static updateShift(shiftId, updates) {
        const data = this.readDatabase();
        if (!data.shifts) {
            data.shifts = [];
            data.nextShiftId = 1;
            this.writeDatabase(data);
            return null;
        }
        const shiftIndex = data.shifts.findIndex(s => s.id === shiftId);
        if (shiftIndex !== -1) {
            data.shifts[shiftIndex] = { ...data.shifts[shiftIndex], ...updates };
            this.writeDatabase(data);
            return data.shifts[shiftIndex];
        }
        return null;
    }
}
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=Database.js.map