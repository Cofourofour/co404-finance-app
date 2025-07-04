import fs from 'fs';
import path from 'path';
import { Database, User, Transaction, Shift } from '../types';

const dbPath = path.join(__dirname, '../../co404_database.json');

export class DatabaseService {
  // Read database
  static readDatabase(): Database {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
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

  // Write database
  static writeDatabase(data: Database): void {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Write database error:', error);
    }
  }

  // User operations
  static getUserById(id: number): User | null {
    const data = this.readDatabase();
    return data.users.find(user => user.id === id) || null;
  }

  static getUserByUsername(username: string): User | null {
    const data = this.readDatabase();
    return data.users.find(user => user.username === username) || null;
  }

  // Transaction operations
  static getTransactions(whereClause: string = '', params: any[] = []): Transaction[] {
    const data = this.readDatabase();
    let transactions = data.transactions;
    
    // Simple filtering for location and user
    if (whereClause.includes('location = ?') && params[0]) {
      transactions = transactions.filter(t => t.location === params[0]);
    }
    if (whereClause.includes('addedBy = ?') && params[0]) {
      transactions = transactions.filter(t => t.addedBy === params[0]);
    }
    
    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static insertTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const data = this.readDatabase();
    const newTransaction: Transaction = {
      id: data.nextTransactionId++,
      ...transaction,
      created_at: new Date().toISOString()
    };
    data.transactions.push(newTransaction);
    this.writeDatabase(data);
    return newTransaction;
  }

  // Shift operations
  static insertShift(shift: Omit<Shift, 'id' | 'created_at'>): Shift {
    const data = this.readDatabase();
    
    // Safety check: ensure shifts array exists
    if (!data.shifts) {
      data.shifts = [];
      data.nextShiftId = 1;
    }
    
    const newShift: Shift = {
      id: data.nextShiftId++,
      ...shift,
      created_at: new Date().toISOString()
    };
    data.shifts.push(newShift);
    this.writeDatabase(data);
    return newShift;
  }

  static getActiveShift(username: string, location: string): Shift | null {
    const data = this.readDatabase();
    
    // Safety check: ensure shifts array exists
    if (!data.shifts) {
      data.shifts = [];
      data.nextShiftId = 1;
      this.writeDatabase(data);
    }
    
    return data.shifts.find(s => 
      s.username === username && 
      s.location === location && 
      s.status === 'active'
    ) || null;
  }

  static updateShift(shiftId: number, updates: Partial<Shift>): Shift | null {
    const data = this.readDatabase();
    
    // Safety check: ensure shifts array exists
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