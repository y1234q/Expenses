import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import type { Transaction, TransactionType, CurrencyCode, Language, Theme } from '../types';
import { formatDateYYYYMMDD, CATEGORY_EMOJIS, SUBCATEGORY_EMOJIS } from '../utils';
import { t, getCategoryLabel, getSubcategoryLabel } from '../i18n';
import { CalculatorKeyboard } from './CalculatorKeyboard';
import { 
  Bus, Utensils, Film, ShoppingBag, Home, 
  Package, DollarSign, Briefcase, TrendingUp, Wallet, Stethoscope, Globe, Calculator
} from 'lucide-react';

interface AddTransactionProps {
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  language?: Language;
  theme?: Theme;
}

interface CategoryConfig {
  name: string;
  icon: any;
  subcategories: string[];
}

export default function AddTransaction({ onAdd, onCancel, language = 'zh', theme = 'light' }: AddTransactionProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('NTD');
  const [category, setCategory] = useState('Eat');
  const [subcategory, setSubcategory] = useState('Lunch');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [date, setDate] = useState(() => formatDateYYYYMMDD(new Date()));
  const [showCalculator, setShowCalculator] = useState(false);

  const handleAddTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      let newTag = tagInput.trim();
      if (!newTag.startsWith('#')) {
        newTag = '#' + newTag;
      }
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const isDark = theme === 'dark';
  const currencies: CurrencyCode[] = ['NTD', 'USD', 'JPY', 'EUR', 'HKD', 'CNY'];

  // 7 core Expense Categories & Subcategories
  const expenseCategories: CategoryConfig[] = [
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

  // Income Categories
  const incomeCategories: CategoryConfig[] = [
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

  const categoryList = type === 'expense' ? expenseCategories : incomeCategories;
  const currentCategoryConfig = categoryList.find(c => c.name === category) || categoryList[0];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newList = newType === 'expense' ? expenseCategories : incomeCategories;
    setCategory(newList[0].name);
    setSubcategory(newList[0].subcategories[0]);
  };

  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    const config = categoryList.find(c => c.name === catName);
    if (config && config.subcategories.length > 0) {
      setSubcategory(config.subcategories[0]);
    } else {
      setSubcategory('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert(t(language, 'enterValidAmount'));
      return;
    }

    const selectedDate = date ? new Date(`${date}T12:00:00`) : new Date();

    onAdd({
      type,
      amount: Number(amount),
      currency,
      category,
      subcategory,
      note: note || getSubcategoryLabel(subcategory, language) || getCategoryLabel(category, language),
      tags,
      date: selectedDate.toISOString(),
    });
  };

  // Category Theme map
  const categoryThemeMap: { [key: string]: { active: string; inactive: string; text: string; subActive: string } } = {
    'Eat': {
      active: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/30',
      inactive: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/50' : 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/80',
      text: 'text-amber-600',
      subActive: 'bg-amber-500 text-white',
    },
    'Daily Use': {
      active: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-md shadow-emerald-500/30',
      inactive: isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50' : 'bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80',
      text: 'text-emerald-600',
      subActive: 'bg-emerald-500 text-white',
    },
    'Housing': {
      active: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-indigo-500 shadow-md shadow-indigo-500/30',
      inactive: isDark ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800 hover:bg-indigo-900/50' : 'bg-indigo-50/70 text-indigo-800 border-indigo-200 hover:bg-indigo-100/80',
      text: 'text-indigo-600',
      subActive: 'bg-indigo-500 text-white',
    },
    'Transport': {
      active: 'bg-gradient-to-br from-sky-500 to-blue-500 text-white border-sky-500 shadow-md shadow-sky-500/30',
      inactive: isDark ? 'bg-sky-950/40 text-sky-300 border-sky-800 hover:bg-sky-900/50' : 'bg-sky-50/70 text-sky-800 border-sky-200 hover:bg-sky-100/80',
      text: 'text-sky-600',
      subActive: 'bg-sky-500 text-white',
    },
    'Entertainment': {
      active: 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white border-purple-500 shadow-md shadow-purple-500/30',
      inactive: isDark ? 'bg-purple-950/40 text-purple-300 border-purple-800 hover:bg-purple-900/50' : 'bg-purple-50/70 text-purple-800 border-purple-200 hover:bg-purple-100/80',
      text: 'text-purple-600',
      subActive: 'bg-purple-500 text-white',
    },
    'Shop': {
      active: 'bg-gradient-to-br from-rose-500 to-pink-500 text-white border-rose-500 shadow-md shadow-rose-500/30',
      inactive: isDark ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900/50' : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100/80',
      text: 'text-rose-600',
      subActive: 'bg-rose-500 text-white',
    },
    'Medical': {
      active: 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-500 shadow-md shadow-red-500/30',
      inactive: isDark ? 'bg-red-950/40 text-red-300 border-red-800 hover:bg-red-900/50' : 'bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100/80',
      text: 'text-red-600',
      subActive: 'bg-red-500 text-white',
    },
    'Salary': { active: 'bg-emerald-600 text-white border-emerald-600', inactive: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-600', subActive: 'bg-emerald-600 text-white' },
    'Freelance': { active: 'bg-teal-600 text-white border-teal-600', inactive: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-teal-50 text-teal-800 border-teal-200', text: 'text-teal-600', subActive: 'bg-teal-600 text-white' },
    'Investments': { active: 'bg-indigo-600 text-white border-indigo-600', inactive: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-indigo-50 text-indigo-800 border-indigo-200', text: 'text-indigo-600', subActive: 'bg-indigo-600 text-white' },
    'Other Income': { active: 'bg-purple-600 text-white border-purple-600', inactive: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-purple-50 text-purple-800 border-purple-200', text: 'text-purple-600', subActive: 'bg-purple-600 text-white' }
  };

  const currentTheme = categoryThemeMap[category] || categoryThemeMap['Eat'];

  return (
    <div className={`flex-1 overflow-y-auto pb-24 pt-10 px-4 h-full scrollbar-none transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(language, 'addTransactionTitle')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'addTransactionSubtitle')}
          </p>
        </div>
        <button 
          type="button" 
          onClick={onCancel}
          className="text-xs font-bold text-blue-500 hover:text-blue-600 px-2.5 py-1.5 rounded-xl hover:bg-blue-500/10 transition-colors"
        >
          {t(language, 'cancel')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Segmented Control for Type */}
        <div className={`p-1 rounded-2xl flex space-x-1 shadow-inner ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-200/70'
        }`}>
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'expense' 
                ? isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t(language, 'expenseTab')}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'income' 
                ? isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-400'
            }`}
          >
            {t(language, 'incomeTab')}
          </button>
        </div>

        {/* Currency & Amount & Date Inputs */}
        <div className={`rounded-3xl overflow-hidden border shadow-sm divide-y transition-colors ${
          isDark ? 'bg-slate-800 border-slate-700 divide-slate-700' : 'bg-white border-gray-100 divide-gray-100'
        }`}>
          {/* Currency Selector */}
          <div className="p-3 flex items-center justify-between">
            <span className={`font-bold text-xs flex items-center space-x-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              <Globe size={14} className="text-blue-500" />
              <span>{t(language, 'currencyLabel')}</span>
            </span>
            <div className="flex space-x-1">
              {currencies.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-2 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    currency === c 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div 
            className="p-4 flex items-center cursor-pointer select-none"
            onClick={() => setShowCalculator(true)}
          >
            <span className={`font-bold text-xs w-20 shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              {t(language, 'amountLabel')}
            </span>
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-base font-black text-blue-500 mr-1.5">{currency}</span>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  placeholder="0"
                  value={amount}
                  className={`w-full text-2xl font-black bg-transparent focus:outline-none cursor-pointer ${
                    isDark ? 'text-white placeholder-slate-600' : 'text-gray-900 placeholder-gray-300'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCalculator(true);
                }}
                className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Calculator size={15} />
                <span>{language === 'zh' ? '計算機' : 'Calc'}</span>
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div className="p-3.5 flex items-center">
            <span className={`font-bold text-xs w-20 shrink-0 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              {t(language, 'dateLabel')}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`flex-1 bg-transparent font-bold text-sm focus:outline-none cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div>
          <label className={`block text-xs font-extrabold mb-2 px-1 uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-gray-600'
          }`}>
            {t(language, 'categoryLabel')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {categoryList.map((cat) => {
              const isSelected = category === cat.name;
              const theme = categoryThemeMap[cat.name] || categoryThemeMap['Eat'];
              const emoji = CATEGORY_EMOJIS[cat.name] || '📝';
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl transition-all border ${
                    isSelected 
                      ? theme.active
                      : theme.inactive
                  }`}
                >
                  <span className="text-2xl mb-1">{emoji}</span>
                  <span className="text-[11px] font-bold tracking-tight text-center truncate w-full">
                    {getCategoryLabel(cat.name, language)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Pills */}
        {currentCategoryConfig && currentCategoryConfig.subcategories.length > 0 && (
          <div>
            <label className={`block text-xs font-extrabold mb-2 px-1 uppercase tracking-wider ${
              isDark ? 'text-slate-300' : 'text-gray-600'
            }`}>
              {t(language, 'subcategoryLabel')}
            </label>
            <div className={`flex flex-wrap gap-1.5 p-3 rounded-2xl border shadow-sm ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
            }`}>
              {currentCategoryConfig.subcategories.map((sub) => {
                const isSubSelected = subcategory === sub;
                const subEmoji = SUBCATEGORY_EMOJIS[sub] || '';
                return (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => setSubcategory(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                      isSubSelected
                        ? currentTheme.subActive + ' shadow-sm'
                        : isDark
                          ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {subEmoji && <span className="mr-0.5">{subEmoji}</span>}
                    <span>{getSubcategoryLabel(sub, language)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Note Input */}
        <div className={`rounded-3xl p-3.5 border shadow-sm ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
        }`}>
          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'noteLabel')}
          </label>
          <input
            type="text"
            placeholder={t(language, 'notePlaceholder')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full text-xs font-semibold bg-transparent focus:outline-none mb-3 ${
              isDark ? 'text-white placeholder-slate-600' : 'text-gray-900 placeholder-gray-300'
            }`}
          />
          <div className="h-px w-full bg-slate-200/50 dark:bg-slate-700/50 mb-3"></div>
          <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'tagsLabel')}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                <span>{tag}</span>
                <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 ml-1">
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder={t(language, 'tagsPlaceholder')}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className={`w-full text-xs font-semibold bg-transparent focus:outline-none ${
              isDark ? 'text-white placeholder-slate-600' : 'text-gray-900 placeholder-gray-300'
            }`}
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-xs tracking-wide cursor-pointer"
        >
          {t(language, 'saveBtn')}
        </button>
      </form>

      {/* Calculator Bottom Sheet */}
      {showCalculator && (
        <CalculatorKeyboard
          initialValue={amount}
          currency={currency}
          isDark={isDark}
          onConfirm={(val) => setAmount(val)}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
