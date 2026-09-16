export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'NTD' | 'USD' | 'JPY' | 'EUR' | 'HKD' | 'CNY';

export interface ExchangeRates {
  NTD: number;
  USD: number;
  JPY: number;
  EUR: number;
  HKD: number;
  CNY: number;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: CurrencyCode; // Default to NTD
  type: TransactionType;
  category: string;
  subcategory?: string;
  note: string;
  tags?: string[]; // Array of tags like ['#travel', '#business']
  date: string; // ISO date string
  recurringRuleId?: string;
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RecurringRule {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  category: string;
  subcategory?: string;
  dayOfMonth: number; // 1 ~ 31
  startDate?: string; // YYYY-MM
  startMonth?: string; // YYYY-MM
  endDate?: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
  isActive?: boolean;
  note?: string;
  lastGeneratedMonth?: string; // YYYY-MM
}

export interface CategoryBudgets {
  [category: string]: number;
}

export type Language = 'zh' | 'en';
export type Theme = 'light' | 'dark';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarEmoji: string;
  createdAt: string;
  lastSyncAt: string;
}
