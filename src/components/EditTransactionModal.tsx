import React, { useState, useEffect } from 'react';
import { 
  X, Trash2, Calendar, Tag, FileText, Check, Plus
} from 'lucide-react';
import { Transaction, TransactionType, CurrencyCode, Language, Theme } from '../types';
import { formatDateYYYYMMDD, getCategoryEmoji } from '../utils';
import { t, getCategoryLabel, getSubcategoryLabel } from '../i18n';
import { CalculatorKeyboard } from './CalculatorKeyboard';
import { EXPENSE_CATEGORIES_CONFIG, INCOME_CATEGORIES_CONFIG } from '../constants/categories';

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NTD: 'NT$',
  USD: '$',
  JPY: '¥',
  EUR: '€',
  HKD: 'HK$',
  CNY: '¥',
};

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  language: Language;
  theme: Theme;
  onSave: (updated: Transaction) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  language,
  theme,
  onSave,
  onDelete,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const isDark = theme === 'dark';
  const currencies: CurrencyCode[] = ['NTD', 'USD', 'JPY', 'EUR', 'HKD', 'CNY'];

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<string>(String(transaction.amount));
  const [currency, setCurrency] = useState<CurrencyCode>(transaction.currency || 'NTD');
  const [category, setCategory] = useState<string>(transaction.category);
  const [subcategory, setSubcategory] = useState<string>(transaction.subcategory || '');
  const [note, setNote] = useState<string>(transaction.note || '');
  const [date, setDate] = useState<string>(formatDateYYYYMMDD(transaction.date));
  const [tags, setTags] = useState<string[]>(transaction.tags || []);
  const [tagInput, setTagInput] = useState<string>('');
  
  // Custom calculator modal
  const [showCalculator, setShowCalculator] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);

  // Sync state whenever transaction changes
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCurrency(transaction.currency || 'NTD');
      setCategory(transaction.category);
      setSubcategory(transaction.subcategory || '');
      setNote(transaction.note || '');
      setDate(formatDateYYYYMMDD(transaction.date));
      setTags(transaction.tags || []);
      setTagInput('');
      setShowCalculator(false);
      setCurrencyMenuOpen(false);
    }
  }, [transaction]);

  const categoryList = type === 'expense' ? EXPENSE_CATEGORIES_CONFIG : INCOME_CATEGORIES_CONFIG;
  const currentCategoryConfig = categoryList.find(c => c.name === category) || categoryList[0];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newList = newType === 'expense' ? EXPENSE_CATEGORIES_CONFIG : INCOME_CATEGORIES_CONFIG;
    setCategory(newList[0].name);
    setSubcategory(newList[0].subcategories[0] || '');
  };

  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    const cfg = categoryList.find(c => c.name === catName);
    if (cfg && cfg.subcategories.length > 0) {
      setSubcategory(cfg.subcategories[0]);
    } else {
      setSubcategory('');
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      alert(t(language, 'enterValidAmount'));
      return;
    }

    // Preserve the original timestamp hours/minutes if same date, or noon
    let finalDateIso = transaction.date;
    const origDatePart = formatDateYYYYMMDD(transaction.date);
    if (date !== origDatePart) {
      finalDateIso = new Date(`${date}T12:00:00`).toISOString();
    }

    const updated: Transaction = {
      ...transaction,
      type,
      amount: num,
      currency,
      category,
      subcategory: subcategory || undefined,
      note: note.trim(),
      tags,
      date: finalDateIso,
      updatedAt: Date.now(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="edit-transaction-overlay"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-transaction-card"
        className={`w-full max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-500/10">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black">
              {language === 'zh' ? '編輯明細內容' : 'Edit Transaction'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {type === 'income' ? t(language, 'incomeLabel') : t(language, 'expenseLabel')}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(t(language, 'deleteConfirm'))) {
                    onDelete(transaction.id);
                    onClose();
                  }
                }}
                className="p-2 text-gray-400 hover:text-rose-500 rounded-full transition-colors cursor-pointer"
                title={t(language, 'deleteConfirm')}
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
          {/* Expense / Income Tab Switcher */}
          <div className={`p-1 rounded-2xl flex ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : isDark ? 'text-slate-400' : 'text-gray-600'
              }`}
            >
              {t(language, 'expenseLabel')}
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : isDark ? 'text-slate-400' : 'text-gray-600'
              }`}
            >
              {t(language, 'incomeLabel')}
            </button>
          </div>

          {/* Amount & Currency Section with Calculator Trigger */}
          <div className={`p-4 rounded-3xl border shadow-sm ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex justify-between items-center text-[11px] text-gray-400 font-bold mb-1">
              <span>{language === 'zh' ? '點擊金額喚出計算機' : 'Tap amount to open calculator'}</span>
              <span className="text-blue-500 font-semibold">{type === 'expense' ? '支出' : '收入'}</span>
            </div>
            
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowCalculator(true)}
            >
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-black ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {CURRENCY_SYMBOLS[currency]}
                </span>
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={amount}
                  onFocus={(e) => {
                    e.currentTarget.blur();
                    setShowCalculator(true);
                  }}
                  onClick={() => setShowCalculator(true)}
                  className={`text-3xl font-black bg-transparent outline-none w-48 cursor-pointer select-none ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}
                />
              </div>

              {/* Currency Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrencyMenuOpen(!currencyMenuOpen);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-800 shadow-xs'
                  }`}
                >
                  <span>{currency}</span>
                  <span className="text-[9px] opacity-60">▼</span>
                </button>

                {currencyMenuOpen && (
                  <div className={`absolute right-0 mt-1 w-28 py-1 rounded-2xl shadow-xl border z-30 ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
                  }`}>
                    {currencies.map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrency(curr);
                          setCurrencyMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-bold flex justify-between items-center ${
                          curr === currency ? 'text-blue-500 font-black' : isDark ? 'text-slate-300' : 'text-gray-700'
                        }`}
                      >
                        <span>{curr}</span>
                        {curr === currency && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Picker Input */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <label className="text-[11px] text-gray-400 font-bold block mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-blue-500" />
              <span>{t(language, 'dateLabel')}</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full text-xs font-black p-2 rounded-xl border bg-transparent outline-none ${
                isDark ? 'text-white border-slate-700' : 'text-gray-900 border-gray-200 bg-white'
              }`}
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="text-[11px] text-gray-400 font-bold block mb-2">
              {t(language, 'categoryLabel')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categoryList.map((cat) => {
                const isSelected = cat.name === category;
                const emoji = getCategoryEmoji(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-[10px] font-bold truncate w-full">
                      {getCategoryLabel(cat.name, language)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory Pills */}
          {currentCategoryConfig && currentCategoryConfig.subcategories.length > 0 && (
            <div>
              <label className="text-[11px] text-gray-400 font-bold block mb-1.5">
                {t(language, 'subcategoryLabel')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentCategoryConfig.subcategories.map((sub) => {
                  const isSelected = sub === subcategory;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubcategory(sub)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getSubcategoryLabel(sub, language)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <label className="text-[11px] text-gray-400 font-bold block mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-blue-500" />
              <span>{t(language, 'noteLabel')}</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(language, 'notePlaceholder')}
              className={`w-full text-xs font-semibold p-2 rounded-xl border bg-transparent outline-none ${
                isDark ? 'text-white border-slate-700' : 'text-gray-900 border-gray-200 bg-white'
              }`}
            />
          </div>

          {/* Tags Section */}
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50 border-gray-100'
          }`}>
            <label className="text-[11px] text-gray-400 font-bold block mb-1.5 flex items-center gap-1.5">
              <Tag size={13} className="text-blue-500" />
              <span>{t(language, 'tagsLabel')}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 flex items-center gap-1"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-rose-500 ml-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder={t(language, 'tagsPlaceholder')}
                className={`flex-1 text-xs font-semibold p-2 rounded-xl border bg-transparent outline-none ${
                  isDark ? 'text-white border-slate-700' : 'text-gray-900 border-gray-200 bg-white'
                }`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>{language === 'zh' ? '添加' : 'Add'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 border-t border-gray-500/10 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-colors ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {t(language, 'cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Check size={16} />
            <span>{language === 'zh' ? '儲存修改' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Embedded Calculator for editing amount without zooming */}
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
};
