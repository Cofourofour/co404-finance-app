import { User, Transaction, Shift, EXPENSE_CATEGORIES, LOCATION_CURRENCY } from './types';
import { EXCHANGE_RATES } from './config/constants';

console.log('🚀 Co404 TypeScript Types Test');

// Test User type
const testUser: User = {
  id: 1,
  username: 'laurens',
  password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role: 'admin',
  name: 'Laurens',
  location: 'all'
};

// Test Transaction type
const testTransaction: Transaction = {
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

// Test constants
console.log('✅ User:', testUser.name, testUser.role);
console.log('✅ Transaction:', testTransaction.description, testTransaction.amount);
console.log('✅ Expense categories:', EXPENSE_CATEGORIES.length);
console.log('✅ Exchange rates:', EXCHANGE_RATES);
console.log('✅ Location currencies:', LOCATION_CURRENCY);

console.log('🎉 All Co404 types working correctly!');

// Test type safety
console.log('✨ TypeScript is enforcing Co404 business rules!');