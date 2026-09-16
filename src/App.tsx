/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Analysis from './components/Analysis';
import Settings from './components/Settings';
import RecurringManager from './components/RecurringManager';
import BottomNav from './components/BottomNav';
import type { Transaction, CategoryBudgets, UserAccount, Language, Theme, RecurringRule, ExchangeRates } from './types';
import { DEFAULT_EXCHANGE_RATES } from './utils';
import { 
  useFirestoreSync, 
  saveTransactionToFirestore, 
  deleteTransactionFromFirestore, 
  saveSettingsToFirestore 
} from './useFirestore';

const DEFAULT_CATEGORY_BUDGETS: CategoryBudgets = {
  'Eat': 5000,
  'Daily Use': 3000,
  'Housing': 8000,
  'Transport': 2000,
  'Entertainment': 3000,
  'Shop': 3000,
  'Medical': 2000,
};

const INITIAL_RECURRING_RULES: RecurringRule[] = [
  {
    id: 'rec_rent_1',
    title: '每月房屋套房租金',
    amount: 15000,
    type: 'expense',
    category: 'Housing',
    subcategory: 'House Rent',
    currency: 'NTD',
    dayOfMonth: 5,
    startDate: '2026-03',
    startMonth: '2026-03',
    isActive: true,
    note: '固定每月5日自動記錄租金'
  },
  {
    id: 'rec_salary_1',
    title: '每月正職薪資',
    amount: 52000,
    type: 'income',
    category: 'Salary',
    subcategory: 'Regular Salary',
    currency: 'NTD',
    dayOfMonth: 1,
    startDate: '2026-01',
    startMonth: '2026-01',
    isActive: true,
    note: '每月1號撥薪'
  },
  {
    id: 'rec_cloud_sub',
    title: 'ChatGPT & Cloud 訂閱',
    amount: 20,
    type: 'expense',
    category: 'Entertainment',
    subcategory: 'Streaming',
    currency: 'USD',
    dayOfMonth: 15,
    startDate: '2026-02',
    startMonth: '2026-02',
    isActive: true,
    note: '每月15日自動扣款美金服務'
  }
];

function getInitialSampleTransactions(): Transaction[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 3);
  const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

  return [
    { id: '1', amount: 52000, type: 'income', category: 'Salary', subcategory: 'Regular Salary', note: '每月薪資入帳', date: `${todayStr}T09:00:00.000Z`, currency: 'NTD' },
    { id: '2', amount: 180, type: 'expense', category: 'Eat', subcategory: 'Breakfast', note: '早餐咖啡與三明治', date: `${todayStr}T10:15:00.000Z`, currency: 'NTD' },
    { id: '3', amount: 1250, type: 'expense', category: 'Eat', subcategory: 'Grocery', note: '採買新鮮蔬菜生鮮', date: `${yesterdayStr}T18:30:00.000Z`, currency: 'NTD' },
    { id: '4', amount: 150, type: 'income', category: 'Freelance', subcategory: 'Consulting', note: '美商海外接案諮詢', date: `${yesterdayStr}T14:00:00.000Z`, currency: 'USD' },
    { id: '5', amount: 650, type: 'expense', category: 'Transport', subcategory: 'Fuel', note: '加油站加滿', date: `${threeDaysAgoStr}T11:20:00.000Z`, currency: 'NTD' },
    { id: '6', amount: 15000, type: 'expense', category: 'Housing', subcategory: 'House Rent', note: '3月-6月套房租金', date: `${todayStr}T08:00:00.000Z`, currency: 'NTD', recurringRuleId: 'rec_rent_1' },
    { id: '7', amount: 480, type: 'expense', category: 'Eat', subcategory: 'Dinner', note: '晚餐同事聚餐拉麵', date: `${todayStr}T19:30:00.000Z`, currency: 'NTD' },
    { id: '8', amount: 3500, type: 'expense', category: 'Shop', subcategory: 'Apparel', note: '日本東京服飾藥妝採買', date: `${yesterdayStr}T15:00:00.000Z`, currency: 'JPY' },
    { id: '9', amount: 1800, type: 'expense', category: 'Housing', subcategory: 'Accommodation', note: '出遊飯店訂金', date: `${yesterdayStr}T20:00:00.000Z`, currency: 'NTD' },
  ];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Language state: 'zh' | 'en'
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('expense_tracker_language') as Language) || 'zh';
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_language', language);
  }, [language]);

  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('expense_tracker_theme') as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_theme', theme);
  }, [theme]);

  // Exchange rates state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
    const saved = localStorage.getItem('expense_tracker_exchange_rates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_EXCHANGE_RATES; }
    }
    return DEFAULT_EXCHANGE_RATES;
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_exchange_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  // User auth state
  const [user, setUser] = useState<UserAccount | null>(() => {
    const savedUser = localStorage.getItem('expense_tracker_user');
    if (savedUser) {
      try { return JSON.parse(savedUser); } catch (e) { return null; }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('expense_tracker_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('expense_tracker_user');
    }
  }, [user]);
  
  // Category budgets state stored in local storage
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>(() => {
    const saved = localStorage.getItem('expense_tracker_category_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CATEGORY_BUDGETS;
      }
    }
    return DEFAULT_CATEGORY_BUDGETS;
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_category_budgets', JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  // Recurring rules state stored in local storage
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(() => {
    const saved = localStorage.getItem('expense_tracker_recurring_rules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_RECURRING_RULES; }
    }
    return INITIAL_RECURRING_RULES;
  });

  useEffect(() => {
    localStorage.setItem('expense_tracker_recurring_rules', JSON.stringify(recurringRules));
  }, [recurringRules]);

  // Derived overall monthly budget
  const totalMonthlyBudget = (Object.values(categoryBudgets) as number[]).reduce((sum: number, b: number) => sum + (b || 0), 0);
  
  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('expense_tracker_data');
    if (saved) return JSON.parse(saved);
    return getInitialSampleTransactions();
  });

  // Activate Firestore real-time synchronization
  useFirestoreSync(user?.id, setTransactions, setCategoryBudgets, setRecurringRules, setExchangeRates);

  useEffect(() => {
    localStorage.setItem('expense_tracker_data', JSON.stringify(transactions));
  }, [transactions]);

  // Handle user login & auto cloud sync / restore check
  const handleLogin = (newUser: UserAccount) => {
    setUser(newUser);
    saveSettingsToFirestore(newUser.id, { categoryBudgets, recurringRules, exchangeRates });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleManualSync = () => {
    if (!user) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    transactions.forEach(t => saveTransactionToFirestore(user.id, t));
    saveSettingsToFirestore(user.id, { categoryBudgets, recurringRules, exchangeRates });
    setUser({ ...user, lastSyncAt: nowTime });
  };

  const handleManualRestore = () => {
    // Already synced via Firestore onSnapshot
  };

  const handleResetData = () => {
    const initial = getInitialSampleTransactions();
    setTransactions(initial);
    setCategoryBudgets(DEFAULT_CATEGORY_BUDGETS);
    setRecurringRules(INITIAL_RECURRING_RULES);
    if (user) {
      initial.forEach(t => saveTransactionToFirestore(user.id, t));
      saveSettingsToFirestore(user.id, {
        categoryBudgets: DEFAULT_CATEGORY_BUDGETS,
        recurringRules: INITIAL_RECURRING_RULES,
        exchangeRates
      });
    }
  };

  const handleAdd = (newTransaction: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTransaction,
      id: Math.random().toString(36).substring(2, 9)
    };
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    if (user) saveTransactionToFirestore(user.id, transaction);
    setActiveTab('dashboard');
  };

  const handleDelete = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    if (user) deleteTransactionFromFirestore(user.id, id);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    const updated = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
    setTransactions(updated);
    if (user) saveTransactionToFirestore(user.id, updatedTransaction);
  };

  const handleUpdateCategoryBudget = (category: string, newBudget: number) => {
    const updated = {
      ...categoryBudgets,
      [category]: newBudget
    };
    setCategoryBudgets(updated);
    if (user) saveSettingsToFirestore(user.id, { categoryBudgets: updated });
  };

  const handleUpdateAllCategoryBudgets = (newBudgets: CategoryBudgets) => {
    setCategoryBudgets(newBudgets);
    if (user) saveSettingsToFirestore(user.id, { categoryBudgets: newBudgets });
  };

  // RECURRING TRANSACTIONS HANDLERS
  const handleAddRecurringRule = (newRule: Omit<RecurringRule, 'id'>) => {
    const rule: RecurringRule = {
      ...newRule,
      id: 'rec_' + Math.random().toString(36).substring(2, 9)
    };
    const updated = [...recurringRules, rule];
    setRecurringRules(updated);
    if (user) saveSettingsToFirestore(user.id, { recurringRules: updated });
  };

  const handleUpdateRecurringRule = (updatedRule: RecurringRule) => {
    const updated = recurringRules.map(r => r.id === updatedRule.id ? updatedRule : r);
    setRecurringRules(updated);
    if (user) saveSettingsToFirestore(user.id, { recurringRules: updated });
  };

  const handleDeleteRecurringRule = (id: string) => {
    const updated = recurringRules.filter(r => r.id !== id);
    setRecurringRules(updated);
    if (user) saveSettingsToFirestore(user.id, { recurringRules: updated });
  };

  // Generate recurring transactions for target month (e.g. "2026-08")
  const handleGenerateRecurringTransactions = (targetMonth: string) => {
    const newAddedList: Transaction[] = [];

    recurringRules.forEach(rule => {
      if (rule.isActive === false) return;

      const sMonth = rule.startMonth || rule.startDate || '2020-01';
      if (sMonth > targetMonth) return;

      const eMonth = rule.endMonth || rule.endDate;
      if (eMonth && targetMonth > eMonth) return;

      // Date construction: YYYY-MM-DD
      const day = String(Math.min(28, rule.dayOfMonth || 1)).padStart(2, '0');
      const dateStr = `${targetMonth}-${day}`;

      // Check if transaction already exists for this rule in this target month
      const exists = transactions.some(t => {
        const tDate = t.date.substring(0, 10);
        return t.recurringRuleId === rule.id && tDate.startsWith(targetMonth);
      });

      if (!exists) {
        newAddedList.push({
          id: 'rec_gen_' + Math.random().toString(36).substring(2, 9),
          amount: rule.amount,
          type: rule.type,
          category: rule.category,
          subcategory: rule.subcategory,
          currency: rule.currency || 'NTD',
          note: `[週期自動記帳] ${rule.title} ${rule.note ? `(${rule.note})` : ''}`,
          date: `${dateStr}T08:00:00.000Z`,
          recurringRuleId: rule.id
        });
      }
    });

    if (newAddedList.length > 0) {
      const updated = [...newAddedList, ...transactions];
      setTransactions(updated);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center font-sans antialiased select-none p-0 sm:p-4 transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-gray-900'
    }`}>
      {/* iOS Device Chassis Constraint */}
      <div className={`w-full max-w-[412px] h-[100dvh] sm:h-[840px] sm:rounded-[3.2rem] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] sm:border-[10px] border-gray-900 relative overflow-hidden flex flex-col transition-colors duration-300 ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
      }`}>
        
        {/* Dynamic Island / Notch Spacer (Desktop simulation) */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 h-7 z-50 justify-center items-center pointer-events-none">
          <div className="w-28 h-5 bg-gray-900 rounded-b-2xl"></div>
        </div>

        {/* Views */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            transactions={transactions} 
            monthlyBudget={totalMonthlyBudget}
            exchangeRates={exchangeRates}
            language={language}
            theme={theme}
            onDeleteTransaction={handleDelete}
            onUpdateTransaction={handleUpdateTransaction}
          />
        )}

        {activeTab === 'add' && (
          <AddTransaction 
            onAdd={handleAdd} 
            onCancel={() => setActiveTab('dashboard')} 
            language={language}
            theme={theme}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringManager
            rules={recurringRules}
            onAddRule={handleAddRecurringRule}
            onUpdateRule={handleUpdateRecurringRule}
            onDeleteRule={handleDeleteRecurringRule}
            onGenerateTransactions={handleGenerateRecurringTransactions}
            language={language}
            theme={theme}
          />
        )}
        
        {activeTab === 'analysis' && (
          <Analysis 
            transactions={transactions}
            categoryBudgets={categoryBudgets}
            exchangeRates={exchangeRates}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onUpdateAllCategoryBudgets={handleUpdateAllCategoryBudgets}
            language={language}
            theme={theme}
          />
        )}

        {activeTab === 'settings' && (
          <Settings 
            user={user}
            language={language}
            theme={theme}
            totalMonthlyBudget={totalMonthlyBudget}
            transactionsCount={transactions.length}
            exchangeRates={exchangeRates}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onSync={handleManualSync}
            onRestore={handleManualRestore}
            onResetData={handleResetData}
            onLanguageChange={setLanguage}
            onThemeChange={setTheme}
            onUpdateExchangeRates={setExchangeRates}
          />
        )}

        {/* Navigation */}
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          language={language}
          theme={theme}
        />
      </div>
    </div>
  );
}
