"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CASH_DENOMINATIONS = exports.JWT_SECRET = exports.PAYMENT_METHODS = exports.LOCATION_CURRENCY = exports.EXCHANGE_RATES = void 0;
exports.EXCHANGE_RATES = {
    'MXN': 20,
    'COP': 4000,
    'USD': 1
};
exports.LOCATION_CURRENCY = {
    'San Cristóbal': 'MXN',
    'Oaxaca City': 'MXN',
    'Medellín': 'COP'
};
exports.PAYMENT_METHODS = {
    'San Cristóbal': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
    'Oaxaca City': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
    'Medellín': ['Cash box', 'Pouch manager', 'Card manager'],
    'all': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404', 'Laurens safe']
};
exports.JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';
exports.CASH_DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
//# sourceMappingURL=constants.js.map