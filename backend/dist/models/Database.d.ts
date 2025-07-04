import { Database, User, Transaction, Shift } from '../types';
export declare class DatabaseService {
    static readDatabase(): Database;
    static writeDatabase(data: Database): void;
    static getUserById(id: number): User | null;
    static getUserByUsername(username: string): User | null;
    static getTransactions(whereClause?: string, params?: any[]): Transaction[];
    static insertTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Transaction;
    static insertShift(shift: Omit<Shift, 'id' | 'created_at'>): Shift;
    static getActiveShift(username: string, location: string): Shift | null;
    static updateShift(shiftId: number, updates: Partial<Shift>): Shift | null;
}
//# sourceMappingURL=Database.d.ts.map