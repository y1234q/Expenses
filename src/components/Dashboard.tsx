import { useState, useMemo } from 'react';
import type { Transaction, Language, Theme, ExchangeRates } from '../types';
import { formatCurrency, formatDateYYYYMMDD, getCategoryEmoji, convertCurrency, DEFAULT_EXCHANGE_RATES } from '../utils';
import { t, getCategoryLabel, getSubcategoryLabel } from '../i18n';
import { ArrowDownRight, ArrowUpRight, Wallet, Calendar, ChevronLeft, ChevronRight, Trash2, CalendarRange, Target, Edit3 } from 'lucide-react';
import { EditTransactionModal } from './EditTransactionModal';

type DisplayMode = 'day' | 'week' | 'month' | 'all' | 'custom';

const CATEGORY_STYLE_MAP: { [key: string]: { iconBg: string; textColor: string } } = {
  'Eat': { iconBg: 'bg-amber-100 text-amber-600 border border-amber-200/60', textColor: 'text-amber-600' },
  'Daily Use': { iconBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200/60', textColor: 'text-emerald-600' },
  'Housing': { iconBg: 'bg-indigo-100 text-indigo-600 border border-indigo-200/60', textColor: 'text-indigo-600' },
  'Transport': { iconBg: 'bg-sky-100 text-sky-600 border border-sky-200/60', textColor: 'text-sky-600' },
  'Entertainment': { iconBg: 'bg-purple-100 text-purple-600 border border-purple-200/60', textColor: 'text-purple-600' },
  'Shop': { iconBg: 'bg-rose-100 text-rose-600 border border-rose-200/60', textColor: 'text-rose-600' },
  'Medical': { iconBg: 'bg-red-100 text-red-600 border border-red-200/60', textColor: 'text-red-600' },
  'Salary': { iconBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200/60', textColor: 'text-emerald-600' },
  'Freelance': { iconBg: 'bg-teal-100 text-teal-600 border border-teal-200/60', textColor: 'text-teal-600' },
  'Investments': { iconBg: 'bg-blue-100 text-blue-600 border border-blue-200/60', textColor: 'text-blue-600' },
  'Other Income': { iconBg: 'bg-fuchsia-100 text-fuchsia-600 border border-fuchsia-200/60', textColor: 'text-fuchsia-600' },
};

interface DashboardProps {
  transactions: Transaction[];
  monthlyBudget?: number;
  exchangeRates?: ExchangeRates;
  language?: Language;
  theme?: Theme;
  onDeleteTransaction?: (id: string) => void;
  onUpdateTransaction?: (updated: Transaction) => void;
}

export default function Dashboard({ 
  transactions, 
  monthlyBudget = 20000, 
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  language = 'zh', 
  theme = 'light', 
  onDeleteTransaction,
  onUpdateTransaction,
}: DashboardProps) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('month');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Selected state for filters
  const todayStr = formatDateYYYYMMDD(new Date());
  const [selectedDay, setSelectedDay] = useState<string>(todayStr || '2026-08-04');
  
  const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr || '2026-08');

  // Week state (store the Monday of the selected week)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return formatDateYYYYMMDD(d);
  };
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(getStartOfWeek(new Date()));

  // Custom date range state
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

  // Filter transactions based on selected display mode
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // 1. First filter by date
      let isDateMatch = true;
      const tDateStr = formatDateYYYYMMDD(t.date);
      if (!tDateStr) return false;

      if (displayMode === 'day') {
        isDateMatch = tDateStr === selectedDay;
      } else if (displayMode === 'month') {
        isDateMatch = tDateStr.startsWith(selectedMonth);
      } else if (displayMode === 'week') {
        const selectedWeekEnd = new Date(selectedWeekStart + 'T12:00:00');
        selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 6);
        const endStr = formatDateYYYYMMDD(selectedWeekEnd);
        isDateMatch = tDateStr >= selectedWeekStart && tDateStr <= endStr;
      } else if (displayMode === 'custom') {
        if (!startDate && !endDate) isDateMatch = true;
        else if (startDate && !endDate) isDateMatch = tDateStr >= startDate;
        else if (!startDate && endDate) isDateMatch = tDateStr <= endDate;
        else isDateMatch = tDateStr >= startDate && tDateStr <= endDate;
      }

      if (!isDateMatch) return false;

      // 2. Then filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const categoryLabel = getCategoryLabel(t.category, language).toLowerCase();
        const subLabel = t.subcategory ? getSubcategoryLabel(t.subcategory, language).toLowerCase() : '';
        const noteMatch = t.note ? t.note.toLowerCase().includes(query) : false;
        const tagMatch = t.tags ? t.tags.some(tag => tag.toLowerCase().includes(query)) : false;
        
        return noteMatch || tagMatch || categoryLabel.includes(query) || subLabel.includes(query);
      }

      return true;
    });
  }, [transactions, displayMode, selectedDay, selectedMonth, selectedWeekStart, startDate, endDate, searchQuery, language]);

  // Calculate totals converted to NTD baseline for accurate summary
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency || 'NTD', 'NTD', exchangeRates), 0);
  }, [filteredTransactions, exchangeRates]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency || 'NTD', 'NTD', exchangeRates), 0);
  }, [filteredTransactions, exchangeRates]);

  const balance = totalIncome - totalExpense;

  // Group transactions by date string (YYYY-MM-DD) sorted from latest to oldest
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    const sorted = [...filteredTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach(t => {
      const dateKey = formatDateYYYYMMDD(t.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  // Handle Day navigation
  const shiftDay = (days: number) => {
    const current = new Date(selectedDay + 'T12:00:00');
    current.setDate(current.getDate() + days);
    setSelectedDay(formatDateYYYYMMDD(current));
  };

  const shiftWeek = (weeks: number) => {
    const current = new Date(selectedWeekStart + 'T12:00:00');
    current.setDate(current.getDate() + weeks * 7);
    setSelectedWeekStart(formatDateYYYYMMDD(current));
  };

  const getDisplayModeLabel = (mode: DisplayMode) => {
    switch (mode) {
      case 'day': return t(language, 'filterDay');
      case 'week': return t(language, 'filterWeek');
      case 'month': return t(language, 'filterMonth');
      case 'all': return t(language, 'filterAll');
      case 'custom': return t(language, 'filterCustom');
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-24 pt-10 px-4 h-full scrollbar-none transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(language, 'overviewTitle')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'overviewSubtitle')}
          </p>
        </div>
      </div>

      {/* Segmented Control for 5 Display Modes */}
      <div className={`p-1 rounded-2xl flex space-x-1 mb-4 text-xs font-semibold overflow-x-auto shadow-inner ${
        isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-200/70'
      }`}>
        {(['day', 'week', 'month', 'all', 'custom'] as DisplayMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setDisplayMode(mode)}
            className={`flex-1 py-2 px-2 rounded-xl transition-all whitespace-nowrap text-center ${
              displayMode === mode
                ? isDark
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-white text-gray-900 shadow-sm font-bold'
                : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {getDisplayModeLabel(mode)}
          </button>
        ))}
      </div>

      {/* Date Selectors */}
      <div className={`mb-4 p-3.5 rounded-2xl border shadow-sm ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        {displayMode === 'day' && (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => shiftDay(-1)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center space-x-2">
              <Calendar size={18} className="text-blue-500" />
              <input 
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className={`font-bold bg-transparent focus:outline-none text-sm cursor-pointer ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              />
            </div>
            <button 
              onClick={() => shiftDay(1)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {displayMode === 'month' && (
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              {language === 'zh' ? '選擇分析月份' : 'Select Month'}:
            </span>
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
          </div>
        )}

        {displayMode === 'week' && (
          <div className="flex items-center justify-between">
            <button 
              onClick={() => shiftWeek(-1)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <Calendar size={18} className="text-blue-500" />
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'zh' ? '當週明細' : 'This Week'}
                </span>
              </div>
              <span className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {selectedWeekStart.replace(/-/g, '/')} - {
                  (() => {
                    const end = new Date(selectedWeekStart + 'T12:00:00');
                    end.setDate(end.getDate() + 6);
                    return formatDateYYYYMMDD(end).replace(/-/g, '/');
                  })()
                }
              </span>
            </div>
            <button 
              onClick={() => shiftWeek(1)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {displayMode === 'all' && (
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {language === 'zh' ? '全部歷史紀錄' : 'All Recorded History'}
            </span>
            <span className="text-xs font-semibold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full border border-blue-500/20">
              {filteredTransactions.length} {t(language, 'totalEntriesCount')}
            </span>
          </div>
        )}

        {displayMode === 'custom' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span className="flex items-center gap-1"><CalendarRange size={14} /> {t(language, 'filterCustom')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-[10px] text-gray-400 font-medium">{t(language, 'customStartDate')}</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full bg-transparent font-bold focus:outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
              <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-700/60 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <label className="block text-[10px] text-gray-400 font-medium">{t(language, 'customEndDate')}</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full bg-transparent font-bold focus:outline-none ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Balance Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-3xl p-5 text-white shadow-xl mb-4 shadow-blue-500/20">
        <div className="flex items-center justify-between text-blue-100 mb-1">
          <div className="flex items-center space-x-2">
            <Wallet size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t(language, 'balanceLabel')}
            </span>
          </div>
        </div>
        <div className="text-3xl font-black tracking-tight mb-4">
          {formatCurrency(balance, 'NTD')}
        </div>
        
        <div className="grid grid-cols-2 gap-3 bg-white/10 rounded-2xl p-3 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <div className="bg-emerald-400/20 p-2 rounded-xl">
              <ArrowDownRight size={18} className="text-emerald-300" />
            </div>
            <div>
              <div className="text-[10px] text-blue-100 font-medium">{t(language, 'incomeLabel')}</div>
              <div className="font-bold text-sm text-emerald-200">{formatCurrency(totalIncome, 'NTD')}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 border-l border-white/20 pl-3">
            <div className="bg-rose-400/20 p-2 rounded-xl">
              <ArrowUpRight size={18} className="text-rose-300" />
            </div>
            <div>
              <div className="text-[10px] text-blue-100 font-medium">{t(language, 'expenseLabel')}</div>
              <div className="font-bold text-sm text-rose-200">{formatCurrency(totalExpense, 'NTD')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Quick Tracker Widget */}
      <div className={`rounded-3xl p-4 shadow-sm border mb-5 transition-all ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
      }`}>
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
            <Target size={15} className="text-blue-500" />
            {t(language, 'budgetLimitLabel')}
          </span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
            (totalExpense > monthlyBudget) ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
          }`}>
            {totalExpense > monthlyBudget ? t(language, 'budgetOver') : t(language, 'budgetRemaining')}
          </span>
        </div>
        <div className="flex justify-between items-baseline text-xs mb-1.5">
          <span className={`font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalExpense, 'NTD')}</span>
          <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'budgetTotalLabel')}: {formatCurrency(monthlyBudget, 'NTD')}
          </span>
        </div>
        <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              totalExpense > monthlyBudget ? 'bg-rose-500' : (totalExpense / monthlyBudget) > 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, (totalExpense / monthlyBudget) * 100)}%` }}
          />
        </div>
      </div>

      {/* Transactions Section Header */}
      <div className="mb-3 flex justify-between items-center">
        <h2 className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t(language, 'recentTransactions')} ({filteredTransactions.length})
        </h2>
      </div>

      <div className={`mb-4 px-3 py-2 rounded-2xl border shadow-sm flex items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
        <span className="text-gray-400 mr-2">🔍</span>
        <input
          type="text"
          placeholder={t(language, 'searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 bg-transparent text-xs font-semibold focus:outline-none ${isDark ? 'text-white placeholder-slate-500' : 'text-gray-900 placeholder-gray-400'}`}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
            &times;
          </button>
        )}
      </div>

      {/* Grouped Transactions */}
      {groupedByDate.length === 0 ? (
        <div className={`rounded-3xl p-8 text-center border shadow-sm ${
          isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-white border-gray-100 text-gray-400'
        }`}>
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold">{t(language, 'noTransactions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedByDate.map(([dateKey, items]) => {
            return (
              <div key={dateKey} className={`rounded-3xl p-3 shadow-sm border ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
              }`}>
                {/* Date Group Header */}
                <div className={`flex justify-between items-center px-3 py-1.5 border-b text-xs font-bold rounded-2xl mb-1 ${
                  isDark ? 'bg-slate-700/60 border-slate-700 text-slate-200' : 'bg-gray-50/80 border-gray-100 text-gray-700'
                }`}>
                  <span className="flex items-center gap-1.5 font-mono">
                    <Calendar size={13} className="text-blue-500" />
                    {dateKey}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-500/10">
                  {items.map((item) => {
                    const style = CATEGORY_STYLE_MAP[item.category] || {
                      iconBg: item.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600',
                      textColor: item.type === 'income' ? 'text-emerald-600' : 'text-gray-900'
                    };
                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setEditingTransaction(item)}
                        className={`flex items-center justify-between p-2.5 rounded-2xl transition-colors group cursor-pointer ${
                          isDark ? 'hover:bg-slate-700/60' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${style.iconBg}`}>
                            {getCategoryEmoji(item.category, item.subcategory)}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold text-xs flex flex-wrap items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <span>{getCategoryLabel(item.category, language)}</span>
                              {item.subcategory && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full truncate ${
                                  isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {getSubcategoryLabel(item.subcategory, language)}
                                </span>
                              )}
                              {item.tags && item.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {tag}
                                </span>
                              ))}
                            </p>
                            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                              {item.note || '-'}
                            </p>
                          </div>
                        </div>

                        <div 
                          className="flex items-center space-x-2.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div 
                            className="text-right cursor-pointer"
                            onClick={() => setEditingTransaction(item)}
                          >
                            <div className={`font-black text-xs ${item.type === 'income' ? 'text-emerald-500' : isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency || 'NTD')}
                            </div>
                            {item.currency && item.currency !== 'NTD' && (
                              <div className="text-[10px] text-gray-400 font-medium">
                                ≈ {formatCurrency(convertCurrency(item.amount, item.currency, 'NTD', exchangeRates), 'NTD')}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(item);
                            }}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                            title={language === 'zh' ? '點擊編輯明細' : 'Edit Transaction'}
                          >
                            <Edit3 size={15} />
                          </button>

                          {onDeleteTransaction && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(item.id);
                              }}
                              className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                              title={t(language, 'deleteConfirm')}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={Boolean(editingTransaction)}
          language={language}
          theme={theme}
          onSave={(updated) => {
            if (onUpdateTransaction) {
              onUpdateTransaction(updated);
            }
            setEditingTransaction(null);
          }}
          onDelete={(id) => {
            if (onDeleteTransaction) {
              onDeleteTransaction(id);
            }
            setEditingTransaction(null);
          }}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
