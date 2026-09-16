import type { CurrencyCode, ExchangeRates, Transaction } from './types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  NTD: 1,
  USD: 32.5,
  JPY: 0.21,
  EUR: 35.2,
  HKD: 4.15,
  CNY: 4.5
};

export function formatCurrency(amount: number, currency: CurrencyCode | string = 'NTD'): string {
  if (currency === 'NTD') {
    return `NT$ ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }
  if (currency === 'USD') {
    return `$ ${amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 })} USD`;
  }
  if (currency === 'JPY') {
    return `¥ ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} JPY`;
  }
  if (currency === 'EUR') {
    return `€ ${amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 })} EUR`;
  }
  if (currency === 'HKD') {
    return `HK$ ${amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 })}`;
  }
  if (currency === 'CNY') {
    return `¥ ${amount.toLocaleString('en-US', { maximumFractionDigits: amount % 1 === 0 ? 0 : 2 })} CNY`;
  }
  return `${amount.toLocaleString('en-US')} ${currency}`;
}

export function convertCurrency(
  amount: number, 
  fromCurrency: CurrencyCode = 'NTD', 
  toCurrency: CurrencyCode = 'NTD', 
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  // Convert from source currency to NTD baseline, then to target currency
  const inNTD = amount * fromRate;
  return inNTD / toRate;
}

/**
 * Returns grouped currency totals as string e.g. "20 USD + 15,000 NTD"
 */
export function getDistinctCurrencyTotals(
  transactions: Transaction[], 
  type?: 'expense' | 'income'
): { [currency: string]: number } {
  const totals: { [currency: string]: number } = {};
  
  transactions.forEach(t => {
    if (type && t.type !== type) return;
    const curr = t.currency || 'NTD';
    totals[curr] = (totals[curr] || 0) + t.amount;
  });

  return totals;
}

export function formatDistinctCurrencySummary(totals: { [currency: string]: number }): string {
  const entries = Object.entries(totals).filter(([_, amount]) => amount > 0);
  if (entries.length === 0) return formatCurrency(0, 'NTD');
  
  return entries.map(([curr, amt]) => formatCurrency(amt, curr as CurrencyCode)).join(' + ');
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function formatDateYYYYMMDD(dateStringOrObject: string | Date): string {
  const date = typeof dateStringOrObject === 'string' ? new Date(dateStringOrObject) : dateStringOrObject;
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatMonthYear(dateStringOrObject: string | Date): string {
  const date = typeof dateStringOrObject === 'string' ? new Date(dateStringOrObject) : dateStringOrObject;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

export const CATEGORY_EMOJIS: { [key: string]: string } = {
  'Eat': '🍜',
  'Daily Use': '🧴',
  'Housing': '🏠',
  'Transport': '🚌',
  'Entertainment': '🎬',
  'Shop': '🛍️',
  'Medical': '🏥',
  'Salary': '💼',
  'Freelance': '💻',
  'Investments': '📈',
  'Other Income': '🎁',
  'Other': '📝'
};

export const SUBCATEGORY_EMOJIS: { [key: string]: string } = {
  // Eat
  'Breakfast': '🍳',
  'Lunch': '🍱',
  'Dinner': '🍲',
  'Supper': '🌙',
  'Dessert': '🍰',
  'Drinks': '🧋',
  'Grocery': '🛒',
  // Daily Use
  'Housework': '🧹',
  'Personal Care': '🧼',
  'Fitness': '🏋️‍♂️',
  'Salons & Beauty': '💇‍♀️',
  'Snacks': '🍿',
  // Housing
  'House Rent': '🔑',
  'Electricity': '⚡',
  'Water Use': '💧',
  'Accommodation': '🏨',
  // Transport
  'Bus': '🚌',
  'Metro': '🚇',
  'Train': '🚆',
  'Flight': '✈️',
  'Fuel': '⛽',
  'Taxi': '🚕',
  'Parking': '🅿️',
  // Entertainment
  'Movie': '🍿',
  'KTV': '🎤',
  'Club': '🪩',
  'Alcohol': '🍺',
  'Theme Park': '🎡',
  // Shop
  'Clothes': '👕',
  'Shoes': '👟',
  'Jewelry': '💍',
  'Cosmetics': '💄',
  'Toys': '🧸',
  'Electronics': '📱',
  'Furniture': '🪑',
  // Medical
  'Health Check': '🩺',
  'Drugs': '💊',
  'Doctor': '👨‍⚕️',
  'Gifts': '🎁',
  // Income
  'Regular Salary': '💵',
  'Overtime Pay': '⏰',
  'Bonus': '🧧',
  'Consulting': '🗣️',
  'Design & Dev': '🧑‍💻',
  'Side Business': '🏪',
  'Dividends': '📊',
  'Stocks': '📈',
  'Crypto': '🪙',
  'Interest': '🏦',
  'Rental Income': '🏙️',
  'Gifts / Red Packets': '🧧',
  'Refunds & Cashbacks': '💸',
  'Allowances': '💰',
  'Selling Used Items': '🏷️'
};

export function getCategoryEmoji(category: string, subcategory?: string): string {
  if (subcategory && SUBCATEGORY_EMOJIS[subcategory]) {
    return SUBCATEGORY_EMOJIS[subcategory];
  }
  return CATEGORY_EMOJIS[category] || '📝';
}
