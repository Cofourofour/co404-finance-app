// =============================================================================
// CO404 FINANCE SYSTEM - BUSINESS CONSTANTS
// =============================================================================

export const EXCHANGE_RATES = {
  'MXN': 20,     // 20 MXN = 1 USD
  'COP': 4000,   // 4000 COP = 1 USD
  'USD': 1       // 1 USD = 1 USD
} as const;

export const LOCATION_CURRENCY = {
  'San Cristóbal': 'MXN',
  'Oaxaca City': 'MXN',
  'Medellín': 'COP'
} as const;

export const PAYMENT_METHODS = {
  'San Cristóbal': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Oaxaca City': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Medellín': ['Cash box', 'Pouch manager', 'Card manager'],
  'all': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404', 'Laurens safe']
} as const;

export const JWT_SECRET = process.env.JWT_SECRET || 'co404-super-secret-key-change-this';

export const CASH_DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] as const;