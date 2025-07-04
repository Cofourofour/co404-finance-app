export const EXCHANGE_RATES = {
  'MXN': 20,     // 20 MXN = 1 USD
  'COP': 4000,   // 4000 COP = 1 USD
  'USD': 1       // 1 USD = 1 USD
} as const;

export const PAYMENT_METHODS = {
  'San Cristóbal': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Oaxaca City': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404'],
  'Medellín': ['Cash box', 'Pouch manager', 'Card manager'],
  'all': ['Cash box', 'Pouch manager', 'Card manager', 'Card CO404', 'Laurens safe']
} as const;