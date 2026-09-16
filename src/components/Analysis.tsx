import { useState, useMemo } from 'react';
import type { Transaction, CategoryBudgets, CurrencyCode, ExchangeRates, Language, Theme } from '../types';
import { 
  formatCurrency, 
  formatDateYYYYMMDD, 
  getCategoryEmoji, 
  DEFAULT_EXCHANGE_RATES, 
  convertCurrency 
} from '../utils';
import { t, getCategoryLabel, getSubcategoryLabel } from '../i18n';
import { 
  Calendar, ChevronLeft, ChevronRight, Target, AlertTriangle, 
  BarChart3, PieChart as PieIcon, Sliders, Check, X, 
  Layers, Lightbulb, ArrowLeft, Receipt, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';

interface AnalysisProps {
  transactions: Transaction[];
  categoryBudgets: CategoryBudgets;
  exchangeRates?: ExchangeRates;
  onUpdateCategoryBudget: (category: string, newBudget: number) => void;
  onUpdateAllCategoryBudgets: (newBudgets: CategoryBudgets) => void;
  language?: Language;
  theme?: Theme;
}

const EXPENSE_CATEGORIES = [
  'Eat',
  'Daily Use',
  'Housing',
  'Transport',
  'Entertainment',
  'Shop',
  'Medical'
];

const CATEGORY_COLORS: { [key: string]: string } = {
  'Eat': '#f59e0b',           // Amber
  'Daily Use': '#10b981',      // Emerald
  'Housing': '#6366f1',        // Indigo
  'Transport': '#3b82f6',      // Blue
  'Entertainment': '#8b5cf6',  // Violet
  'Shop': '#ec4899',           // Pink
  'Medical': '#ef4444',        // Red
  'Other': '#6b7280'
};

const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#6366f1', '#14b8a6'];

export default function Analysis({ 
  transactions, 
  categoryBudgets, 
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  onUpdateCategoryBudget,
  onUpdateAllCategoryBudgets,
  language = 'zh',
  theme = 'light'
}: AnalysisProps) {
  const todayStr = formatDateYYYYMMDD(new Date());
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);

  // Base Currency is fixed to NTD for analysis
  const baseCurrency: CurrencyCode = 'NTD';

  // Local state for batch editing category budgets
  const [tempBudgets, setTempBudgets] = useState<CategoryBudgets>({ ...categoryBudgets });

  // Selected category drilldown state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategory(prev => prev === cat ? null : cat);
  };

  const isDark = theme === 'dark';

  // Month navigation helpers
  const shiftMonth = (delta: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  // Filter transactions for the selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const dStr = formatDateYYYYMMDD(t.date);
      return dStr && dStr.startsWith(selectedMonth);
    });
  }, [transactions, selectedMonth]);

  // Converted totals relative to selected baseCurrency
  const convertedTotalIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency || 'NTD', baseCurrency, exchangeRates), 0);
  }, [monthTransactions, baseCurrency, exchangeRates]);

  const convertedTotalExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency || 'NTD', baseCurrency, exchangeRates), 0);
  }, [monthTransactions, baseCurrency, exchangeRates]);

  // Total calculated budget from category budgets (in base currency)
  const totalMonthlyBudget = useMemo(() => {
    const rawTotalNTD = (Object.values(categoryBudgets) as number[]).reduce((sum: number, b: number) => sum + (b || 0), 0);
    return convertCurrency(rawTotalNTD, 'NTD', baseCurrency, exchangeRates);
  }, [categoryBudgets, baseCurrency, exchangeRates]);

  const netSavings = convertedTotalIncome - convertedTotalExpense;
  const savingsRate = convertedTotalIncome > 0 ? Math.max(0, Math.round((netSavings / convertedTotalIncome) * 100)) : 0;

  // Total budget status
  const totalRemaining = totalMonthlyBudget - convertedTotalExpense;
  const isTotalOverBudget = totalRemaining < 0;
  const totalBudgetSpentPercent = totalMonthlyBudget > 0 ? Math.min(100, (convertedTotalExpense / totalMonthlyBudget) * 100) : 0;

  // Expenses category distribution for Pie Chart (converted to baseCurrency)
  const categorySpendingMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Other';
        const converted = convertCurrency(t.amount, t.currency || 'NTD', baseCurrency, exchangeRates);
        map[cat] = (map[cat] || 0) + converted;
      });
    return map;
  }, [monthTransactions, baseCurrency, exchangeRates]);

  const pieChartData = useMemo(() => {
    const items = (Object.entries(categorySpendingMap) as [string, number][]).map(([name, value]) => ({
      name,
      displayName: getCategoryLabel(name, language),
      value,
      percentage: convertedTotalExpense > 0 ? ((value / convertedTotalExpense) * 100).toFixed(1) : '0'
    }));
    return items.sort((a, b) => b.value - a.value);
  }, [categorySpendingMap, convertedTotalExpense, language]);

  // Horizontal Block Chart Data: Category Expenses vs Category Budgets (converted to baseCurrency)
  const horizontalCategoryBudgetData = useMemo(() => {
    return EXPENSE_CATEGORIES.map(cat => {
      const spent = categorySpendingMap[cat] || 0;
      const rawBudgetNTD = categoryBudgets[cat] || 0;
      const budget = convertCurrency(rawBudgetNTD, 'NTD', baseCurrency, exchangeRates);
      const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      return {
        categoryKey: cat,
        category: getCategoryLabel(cat, language),
        Expense: spent,
        Budget: budget,
        percentage,
        isOver: spent > budget && budget > 0
      };
    });
  }, [categorySpendingMap, categoryBudgets, language, baseCurrency, exchangeRates]);

  // Over budget categories alerts
  const overBudgetCategories = useMemo(() => {
    return horizontalCategoryBudgetData.filter(item => item.isOver);
  }, [horizontalCategoryBudgetData]);

  // Vertical Block Chart Data: Total Income vs Total Expense of the Month
  const incomeVsExpenseData = useMemo(() => {
    return [
      {
        name: language === 'zh' ? '本月總計' : 'Monthly Total',
        Income: convertedTotalIncome,
        Expense: convertedTotalExpense,
      }
    ];
  }, [convertedTotalIncome, convertedTotalExpense, language]);

  // Handlers for category budgets
  const handleStartEditBudgets = () => {
    setTempBudgets({ ...categoryBudgets });
    setIsEditingBudgets(true);
  };

  const handleSaveAllBudgets = () => {
    onUpdateAllCategoryBudgets(tempBudgets);
    setIsEditingBudgets(false);
  };

  const handleTempBudgetChange = (cat: string, valStr: string) => {
    const num = parseFloat(valStr) || 0;
    setTempBudgets(prev => ({ ...prev, [cat]: num }));
  };

  // Available categories list
  const availableCategories = useMemo(() => {
    const cats = [...EXPENSE_CATEGORIES];
    Object.keys(categorySpendingMap).forEach(c => {
      if (!cats.includes(c)) cats.push(c);
    });
    return cats;
  }, [categorySpendingMap]);

  // Data for selected category drilldown
  const activeCategoryData = useMemo(() => {
    if (!selectedCategory) return null;

    const filteredTransactions = monthTransactions.filter(
      t => t.type === 'expense' && (t.category || 'Other') === selectedCategory
    );

    const spent = filteredTransactions.reduce(
      (sum, t) => sum + convertCurrency(t.amount, t.currency || 'NTD', baseCurrency, exchangeRates),
      0
    );

    const rawBudget = categoryBudgets[selectedCategory] || 0;
    const budget = convertCurrency(rawBudget, 'NTD', baseCurrency, exchangeRates);
    const remaining = budget - spent;
    const isOver = remaining < 0 && budget > 0;
    const percentOfBudget = budget > 0 ? Math.round((spent / budget) * 100) : 0;
    const shareOfTotal = convertedTotalExpense > 0 ? ((spent / convertedTotalExpense) * 100).toFixed(1) : '0';
    const averageSpent = filteredTransactions.length > 0 ? Math.round(spent / filteredTransactions.length) : 0;

    // Subcategory breakdown
    const subMap: { [sub: string]: { amount: number; count: number } } = {};
    filteredTransactions.forEach(t => {
      const sub = t.subcategory || 'Other';
      const conv = convertCurrency(t.amount, t.currency || 'NTD', baseCurrency, exchangeRates);
      if (!subMap[sub]) subMap[sub] = { amount: 0, count: 0 };
      subMap[sub].amount += conv;
      subMap[sub].count += 1;
    });

    const subcategories = Object.entries(subMap)
      .map(([sub, data]) => ({
        subcategory: sub,
        displayName: getSubcategoryLabel(sub, language),
        amount: data.amount,
        count: data.count,
        percentage: spent > 0 ? ((data.amount / spent) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      categoryKey: selectedCategory,
      displayName: getCategoryLabel(selectedCategory, language),
      emoji: getCategoryEmoji(selectedCategory),
      spent,
      budget,
      remaining,
      isOver,
      percentOfBudget,
      shareOfTotal,
      averageSpent,
      transactionsCount: filteredTransactions.length,
      transactions: [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      subcategories
    };
  }, [selectedCategory, monthTransactions, categoryBudgets, convertedTotalExpense, baseCurrency, exchangeRates, language]);

  return (
    <div className={`flex-1 overflow-y-auto pb-32 pt-10 px-4 h-full scrollbar-none transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(language, 'analysisTitle')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'analysisSubtitle')}
          </p>
        </div>
        <button
          onClick={handleStartEditBudgets}
          className="flex items-center space-x-1.5 text-xs font-bold text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-xl transition-all border border-blue-500/20"
        >
          <Sliders size={14} />
          <span>{t(language, 'editBudgetBtn')}</span>
        </button>
      </div>

      {/* Month Selector */}
      <div className={`mb-3 p-3 rounded-2xl border shadow-sm flex items-center justify-between ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <button 
          onClick={() => shiftMonth(-1)}
          className={`p-2 rounded-xl transition-colors ${
            isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center space-x-2">
          <Calendar size={18} className="text-blue-500" />
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`font-bold bg-transparent focus:outline-none text-sm cursor-pointer ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
        </div>
        <button 
          onClick={() => shiftMonth(1)}
          className={`p-2 rounded-xl transition-colors ${
            isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === null
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
              : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          {t(language, 'allCategories')}
        </button>
        {availableCategories.map(cat => {
          const isSelected = selectedCategory === cat;
          const catSpent = categorySpendingMap[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryToggle(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              title={isSelected ? t(language, 'clickAgainToReturn') : t(language, 'clickCategoryHint')}
            >
              <span>{getCategoryEmoji(cat)}</span>
              <span>{getCategoryLabel(cat, language)}</span>
              {catSpent > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-500'
                }`}>
                  {formatCurrency(catSpent, baseCurrency)}
                </span>
              )}
              {isSelected && (
                <span className="text-[10px] ml-0.5 opacity-90 font-black">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category Budget Editor Sheet */}
      {isEditingBudgets && (
        <div className={`rounded-3xl p-4 shadow-xl border mb-5 animate-fadeIn ${
          isDark ? 'bg-slate-800 border-blue-500/40' : 'bg-white border-blue-200'
        }`}>
          <div className="flex justify-between items-center mb-3 border-b border-gray-500/10 pb-2.5">
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Target size={16} className="text-blue-500" />
                {t(language, 'editBudgetBtn')}
              </h2>
            </div>
            <button 
              onClick={() => setIsEditingBudgets(false)}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-500/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-none">
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat} className={`flex items-center justify-between p-2 rounded-2xl border ${
                isDark ? 'bg-slate-700/50 border-slate-700' : 'bg-gray-50 border-gray-100'
              }`}>
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                  <span className="text-sm">{getCategoryEmoji(cat)}</span>
                  {getCategoryLabel(cat, language)}
                </span>
                <div className={`flex items-center space-x-1 w-32 px-2 py-1 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'
                }`}>
                  <span className="text-[10px] font-bold text-gray-400">NT$</span>
                  <input 
                    type="number"
                    value={tempBudgets[cat] !== undefined ? tempBudgets[cat] : 0}
                    onChange={(e) => handleTempBudgetChange(cat, e.target.value)}
                    className={`w-full text-xs font-extrabold focus:outline-none bg-transparent text-right ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-500/10">
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {t(language, 'budgetTotalLabel')}: <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency((Object.values(tempBudgets) as number[]).reduce((a: number, b: number) => a + (b || 0), 0), 'NTD')}</span>
            </div>
            <button 
              onClick={handleSaveAllBudgets}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-colors"
            >
              <Check size={14} />
              <span>{t(language, 'closeEditBudgetBtn')}</span>
            </button>
          </div>
        </div>
      )}

      {/* CONDITIONAL DISPLAY: DRILLED-DOWN CATEGORY VIEW OR OVERVIEW */}
      {selectedCategory && activeCategoryData ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Navigation Banner */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between shadow-sm ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100'
          }`}>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{t(language, 'backToOverview')}</span>
            </button>
            <span className="text-[11px] text-gray-400 font-medium">
              {t(language, 'clickAgainToReturn')}
            </span>
          </div>

          {/* Primary Category Monthly Overview Card */}
          <div className={`rounded-3xl p-5 shadow-sm border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-blue-50 dark:bg-slate-700/60 shadow-inner">
                  {activeCategoryData.emoji}
                </span>
                <div>
                  <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {activeCategoryData.displayName}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {selectedMonth} {t(language, 'categoryMonthlySpending')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full cursor-pointer"
                title={t(language, 'backToOverview')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Big Spending Display & Budget comparison */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <div>
                  <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(activeCategoryData.spent, baseCurrency)}
                  </span>
                  <span className="text-xs font-semibold ml-2 text-gray-400">
                    / {formatCurrency(activeCategoryData.budget, baseCurrency)}
                  </span>
                </div>
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  activeCategoryData.isOver 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  {activeCategoryData.isOver ? t(language, 'categoryBudgetOver') : t(language, 'categoryBudgetRemaining')}: {formatCurrency(Math.abs(activeCategoryData.remaining), baseCurrency)}
                </span>
              </div>

              {/* Progress bar */}
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    activeCategoryData.isOver
                      ? 'bg-rose-500'
                      : activeCategoryData.percentOfBudget > 80
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(100, activeCategoryData.percentOfBudget)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1.5 font-semibold">
                <span>{t(language, 'budgetExecutionRate')}: {activeCategoryData.percentOfBudget}%</span>
                <span>{t(language, 'categoryShareOfTotal')}: {activeCategoryData.shareOfTotal}%</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-500/10 text-center">
              <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">{t(language, 'categoryShareOfTotal')}</span>
                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeCategoryData.shareOfTotal}%</span>
              </div>
              <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">{t(language, 'categoryTransactionsCount')}</span>
                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeCategoryData.transactionsCount} 筆</span>
              </div>
              <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 font-bold block mb-0.5">平均單筆</span>
                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(activeCategoryData.averageSpent, baseCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Subcategory Distribution (if available) */}
          {activeCategoryData.subcategories.length > 0 && (
            <div className={`rounded-3xl p-4 shadow-sm border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
            }`}>
              <h3 className={`text-xs font-bold flex items-center gap-2 mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BarChart3 size={15} className="text-blue-500" />
                {t(language, 'subcategoryDistribution')}
              </h3>
              <div className="space-y-2.5">
                {activeCategoryData.subcategories.map(sub => (
                  <div key={sub.subcategory} className={`p-2.5 rounded-2xl border ${
                    isDark ? 'bg-slate-700/40 border-slate-700' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                        <span>{getCategoryEmoji(activeCategoryData.categoryKey, sub.subcategory)}</span>
                        <span>{sub.displayName}</span>
                        <span className="text-[10px] text-gray-400 font-normal">({sub.count} 筆)</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(sub.amount, baseCurrency)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                          {sub.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}>
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, Number(sub.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className={`rounded-3xl p-4 shadow-sm border ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Receipt size={15} className="text-emerald-500" />
                {t(language, 'categoryRecordsList')}
              </h3>
              <span className="text-[10px] font-semibold text-gray-400">
                {activeCategoryData.transactions.length} 筆
              </span>
            </div>

            {activeCategoryData.transactions.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs font-bold">
                {t(language, 'noCategoryRecords')}
              </div>
            ) : (
              <div className="space-y-2">
                {activeCategoryData.transactions.map(item => {
                  const dateDisplay = formatDateYYYYMMDD(item.date);
                  const isForeign = item.currency && item.currency !== baseCurrency;
                  const convertedVal = convertCurrency(item.amount, item.currency || 'NTD', baseCurrency, exchangeRates);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        isDark ? 'bg-slate-700/40 border-slate-700/60' : 'bg-gray-50/80 border-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate mr-2">
                        <div className="text-xl p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0">
                          {getCategoryEmoji(item.category, item.subcategory)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.subcategory ? getSubcategoryLabel(item.subcategory, language) : activeCategoryData.displayName}
                            </span>
                            {item.tags && item.tags.length > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-500 font-semibold truncate">
                                {item.tags[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
                            <span>{dateDisplay}</span>
                            {item.note && (
                              <span className="truncate max-w-[140px] text-gray-400">· {item.note}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black block text-rose-500`}>
                          -{formatCurrency(convertedVal, baseCurrency)}
                        </span>
                        {isForeign && (
                          <span className="text-[10px] font-medium text-gray-400 block">
                            ({formatCurrency(item.amount, item.currency)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Back Button */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t(language, 'backToOverview')}</span>
            <span className="text-[10px] opacity-80">（{t(language, 'clickAgainToReturn')}）</span>
          </button>
        </div>
      ) : (
        <>
          {/* Smart Alerts */}
          {overBudgetCategories.length > 0 && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 mb-4 flex items-start space-x-2.5">
              <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-rose-500 block mb-0.5">{t(language, 'overBudgetAlert')}</span>
                <span className="text-rose-400">
                  {overBudgetCategories.map(c => `${c.category} (+${formatCurrency(c.Expense - c.Budget, baseCurrency)})`).join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Total Monthly Budget Overview Card */}
          <div className={`rounded-3xl p-4 shadow-sm border mb-5 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                <Target size={15} className="text-blue-500" />
                {t(language, 'budgetOverviewTitle')}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isTotalOverBudget ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}>
                {isTotalOverBudget 
                  ? `${t(language, 'budgetOver')} (${formatCurrency(Math.abs(totalRemaining), baseCurrency)})` 
                  : `${t(language, 'remainingBudgetCard')}: ${formatCurrency(totalRemaining, baseCurrency)}`}
              </span>
            </div>

            <div className="flex justify-between items-baseline mb-2">
              <div>
                <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(convertedTotalExpense, baseCurrency)}</span>
                <span className={`text-xs font-medium ml-1.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  / {formatCurrency(totalMonthlyBudget, baseCurrency)}
                </span>
              </div>
              <span className={`text-xs font-extrabold ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>
                {totalMonthlyBudget > 0 ? Math.round((convertedTotalExpense / totalMonthlyBudget) * 100) : 0}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isTotalOverBudget 
                    ? 'bg-rose-500' 
                    : (convertedTotalExpense / totalMonthlyBudget) > 0.8 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, totalBudgetSpentPercent)}%` }}
              />
            </div>
          </div>

          {/* PIE CHART: EXPENSE CATEGORY BREAKDOWN */}
          <div className={`rounded-3xl p-4 shadow-sm border mb-5 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <PieIcon size={16} className="text-blue-500" />
                {t(language, 'pieChartTitle')}
              </h2>
              <span className="text-[10px] text-blue-500 font-semibold">{t(language, 'clickCategoryHint')}</span>
            </div>

            {pieChartData.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs font-bold">
                {t(language, 'noExpenseData')}
              </div>
            ) : (
              <div>
                <div className="h-44 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(entry) => entry && entry.name && handleCategoryToggle(String(entry.name))}
                        className="cursor-pointer"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CATEGORY_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(val: any) => formatCurrency(Number(val), baseCurrency)} 
                        contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{t(language, 'totalExpenseCard')}</span>
                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(convertedTotalExpense, baseCurrency)}</span>
                  </div>
                </div>

                {/* Legend - Clickable buttons */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2.5 border-t border-gray-500/10">
                  {pieChartData.map((cat) => {
                    const emoji = getCategoryEmoji(cat.name);
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.name)}
                        className={`flex items-center justify-between text-[11px] p-2 rounded-xl transition-all cursor-pointer text-left border ${
                          isDark 
                            ? 'bg-slate-700/60 hover:bg-slate-700 border-slate-700 hover:border-blue-500/50' 
                            : 'bg-gray-50 hover:bg-blue-50/60 border-gray-100 hover:border-blue-200'
                        }`}
                        title={t(language, 'clickCategoryHint')}
                      >
                        <div className="flex items-center space-x-1.5 truncate mr-1">
                          <span className="text-xs">{emoji}</span>
                          <span className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                            {cat.displayName}
                          </span>
                        </div>
                        <span className={`font-black shrink-0 ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.percentage}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* HORIZONTAL BLOCK CHART - CATEGORY EXPENSES VS CATEGORY BUDGETS */}
          <div className={`rounded-3xl p-4 shadow-sm border mb-5 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BarChart3 size={16} className="text-indigo-500" />
                {t(language, 'budgetProgressTitle')}
              </h2>
              <span className="text-[10px] text-gray-400 font-semibold">{t(language, 'clickCategoryHint')}</span>
            </div>

            {/* Visual Horizontal Block Bar Chart */}
            <div className="h-64 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={horizontalCategoryBudgetData} 
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }} />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    tick={{ fontSize: 10, fill: isDark ? '#e2e8f0' : '#334155', fontWeight: 600 }} 
                    width={85}
                  />
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(Number(value), baseCurrency)}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  <Bar dataKey="Expense" fill="#3b82f6" name={language === 'zh' ? '實際支出' : 'Spent'} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Budget" fill={isDark ? '#475569' : '#cbd5e1'} name={language === 'zh' ? '預算上限' : 'Budget'} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Progress Cards - Clickable */}
            <div className="space-y-2 pt-2 border-t border-gray-500/10">
              {horizontalCategoryBudgetData.map(item => {
                const pct = Math.min(100, item.percentage);
                const emoji = getCategoryEmoji(item.categoryKey);
                return (
                  <div 
                    key={item.categoryKey} 
                    onClick={() => handleCategoryToggle(item.categoryKey)}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                      isDark 
                        ? 'bg-slate-700/40 hover:bg-slate-700/70 border-slate-700 hover:border-blue-500/40' 
                        : 'bg-gray-50/80 hover:bg-blue-50/50 border-gray-100 hover:border-blue-200'
                    }`}
                    title={t(language, 'clickCategoryHint')}
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                        <span className="text-sm">{emoji}</span>
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.Expense, baseCurrency)}</span>
                        <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>/ {formatCurrency(item.Budget, baseCurrency)}</span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          item.isOver ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {item.percentage}%
                        </span>
                        <ChevronRightIcon size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-600' : 'bg-gray-200/70'}`}>
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          item.isOver ? 'bg-rose-500' : item.percentage > 85 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* VERTICAL BLOCK CHART - TOTAL MONTHLY INCOME VS TOTAL EXPENSE */}
          <div className={`rounded-3xl p-4 shadow-sm border mb-5 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Layers size={16} className="text-emerald-500" />
                {language === 'zh' ? '月度總收入與總支出對比' : 'Monthly Income vs Expense'}
              </h2>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenseData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(Number(value), baseCurrency)}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="Income" fill="#10b981" name={t(language, 'incomeLabel')} radius={[6, 6, 0, 0]} barSize={40} />
                  <Bar dataKey="Expense" fill="#ef4444" name={t(language, 'expenseLabel')} radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Net Savings Highlights */}
            <div className="mt-3 p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider block">{t(language, 'netBalance')}</span>
                <span className={`text-base font-black ${netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(netSavings, baseCurrency)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider block">{t(language, 'budgetExecutionRate')}</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-lg border border-emerald-500/20 ${
                  isDark ? 'bg-slate-800 text-emerald-400' : 'bg-white text-emerald-700'
                }`}>
                  {savingsRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Smart Financial Insight Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 text-white shadow-md mb-4 border border-slate-700">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1.5">
              <Lightbulb size={16} />
              <span>{language === 'zh' ? '智慧財務分析建議' : 'Financial Insight'}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {convertedTotalExpense > totalMonthlyBudget
                ? language === 'zh'
                  ? `注意：目前總支出已超出設定預算。建議關注支出較高之分類（如 ${overBudgetCategories.map(c => c.category).join('、') || '餐飲外食'}）以調整次月消費。`
                  : `Notice: Expenses exceeded your target budget. Review high spending categories like ${overBudgetCategories.map(c => c.category).join(', ') || 'Food & Dining'}.`
                : netSavings > 0 
                ? language === 'zh'
                  ? `太棒了！本月預算控管得當，且淨結餘達 ${formatCurrency(netSavings, baseCurrency)}。`
                  : `Great job! Operating within budget limit with a positive net savings of ${formatCurrency(netSavings, baseCurrency)}.`
                : language === 'zh'
                  ? `請持續保持每日記帳習慣，隨時掌握每筆資金流向。`
                  : `Keep recording transactions daily to maintain clear control over your personal finances.`
              }
            </p>
          </div>
        </>
      )}

    </div>
  );
}
