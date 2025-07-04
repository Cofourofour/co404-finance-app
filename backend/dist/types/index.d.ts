export interface User {
    id: number;
    username: string;
    password: string;
    role: 'admin' | 'manager' | 'volunteer';
    name: string;
    location: string;
}
export interface Transaction {
    id: number;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    paymentMethod: string;
    location: string;
    currency: 'MXN' | 'COP' | 'USD';
    date: string;
    addedBy: string;
    shift: number | null;
    created_at: string;
}
export interface TransactionWithUSD extends Transaction {
    amountUSD: number;
    formattedAmount: string;
}
export interface Shift {
    id: number;
    username: string;
    location: string;
    shiftType: 'morning' | 'evening';
    startingCash: number;
    status: 'active' | 'completed';
    startTime: string;
    endTime: string | null;
    transactions: number[];
    finalCount: any;
    variance?: number;
    created_at: string;
}
export interface Database {
    users: User[];
    transactions: Transaction[];
    shifts: Shift[];
    nextUserId: number;
    nextTransactionId: number;
    nextShiftId: number;
}
export declare const EXPENSE_CATEGORIES: readonly ["Cleaning supplies", "Coffee", "Drinking water", "General supplies", "Improvements", "Internet", "Laundry", "Miscellaneous", "Rent", "Utilities", "Volunteer activities", "Volunteer breakfast", "Day-to-day expenses", "Family dinner", "Beers", "Market", "Software", "Expansion", "Taxes", "Maintenance", "Wages", "Airbnb"];
export declare const LOCATION_CURRENCY: {
    readonly 'San Crist\u00F3bal': "MXN";
    readonly 'Oaxaca City': "MXN";
    readonly Medellín: "COP";
};
export type Role = 'admin' | 'manager' | 'volunteer';
export type TransactionType = 'income' | 'expense';
export type Currency = 'MXN' | 'COP' | 'USD';
export type Location = 'San Cristóbal' | 'Oaxaca City' | 'Medellín';
//# sourceMappingURL=index.d.ts.map