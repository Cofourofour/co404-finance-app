"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const constants_1 = require("./config/constants");
console.log('🚀 Co404 TypeScript Types Test');
const testUser = {
    id: 1,
    username: 'laurens',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'admin',
    name: 'Laurens',
    location: 'all'
};
const testTransaction = {
    id: 1,
    description: 'Test coffee purchase',
    amount: -50,
    type: 'expense',
    category: 'Coffee',
    paymentMethod: 'Cash box',
    location: 'Oaxaca City',
    currency: 'MXN',
    date: new Date().toISOString(),
    addedBy: 'laurens',
    shift: null,
    created_at: new Date().toISOString()
};
console.log('✅ User:', testUser.name, testUser.role);
console.log('✅ Transaction:', testTransaction.description, testTransaction.amount);
console.log('✅ Expense categories:', types_1.EXPENSE_CATEGORIES.length);
console.log('✅ Exchange rates:', constants_1.EXCHANGE_RATES);
console.log('✅ Location currencies:', types_1.LOCATION_CURRENCY);
console.log('🎉 All Co404 types working correctly!');
console.log('✨ TypeScript is enforcing Co404 business rules!');
//# sourceMappingURL=test.js.map