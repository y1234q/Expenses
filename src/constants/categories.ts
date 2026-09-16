import React from 'react';
import { 
  Utensils, Package, Home, Bus, Film, ShoppingBag, Stethoscope, 
  DollarSign, Briefcase, TrendingUp, Wallet, LucideIcon 
} from 'lucide-react';

export interface CategoryConfig {
  name: string;
  icon: LucideIcon;
  subcategories: string[];
}

export const EXPENSE_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    name: 'Eat',
    icon: Utensils,
    subcategories: ['Breakfast', 'Lunch', 'Dinner', 'Supper', 'Dessert', 'Drinks', 'Grocery'],
  },
  {
    name: 'Daily Use',
    icon: Package,
    subcategories: ['Housework', 'Personal Care', 'Fitness', 'Salons & Beauty', 'Snacks'],
  },
  {
    name: 'Housing',
    icon: Home,
    subcategories: ['House Rent', 'Electricity', 'Water Use', 'Accommodation'],
  },
  {
    name: 'Transport',
    icon: Bus,
    subcategories: ['Bus', 'Metro', 'Train', 'Flight', 'Fuel', 'Taxi', 'Parking'],
  },
  {
    name: 'Entertainment',
    icon: Film,
    subcategories: ['Movie', 'KTV', 'Club', 'Alcohol', 'Theme Park'],
  },
  {
    name: 'Shop',
    icon: ShoppingBag,
    subcategories: ['Clothes', 'Shoes', 'Jewelry', 'Cosmetics', 'Toys', 'Electronics', 'Furniture'],
  },
  {
    name: 'Medical',
    icon: Stethoscope,
    subcategories: ['Health Check', 'Drugs', 'Doctor', 'Gifts'],
  }
];

export const INCOME_CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    name: 'Salary',
    icon: Briefcase,
    subcategories: ['Regular Salary', 'Overtime Pay', 'Bonus'],
  },
  {
    name: 'Freelance',
    icon: DollarSign,
    subcategories: ['Consulting', 'Design & Dev', 'Side Business'],
  },
  {
    name: 'Investments',
    icon: TrendingUp,
    subcategories: ['Dividends', 'Stocks', 'Crypto', 'Interest', 'Rental Income'],
  },
  {
    name: 'Other Income',
    icon: Wallet,
    subcategories: ['Gifts / Red Packets', 'Refunds & Cashbacks', 'Allowances', 'Selling Used Items'],
  }
];
