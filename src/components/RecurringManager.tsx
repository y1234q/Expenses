import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RecurringRule, CurrencyCode, Language, Theme, TransactionType } from '../types';
import { formatCurrency, getCategoryEmoji } from '../utils';
import { t } from '../i18n';
import { Repeat, Plus, Trash2, Calendar, ShieldCheck, Zap, Check, X } from 'lucide-react';

interface RecurringManagerProps {
  rules?: RecurringRule[];
  recurringRules?: RecurringRule[];
  onAddRule: (rule: Omit<RecurringRule, 'id'>) => void;
  onUpdateRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onGenerateTransactions?: (targetMonth: string) => void;
  onSyncRecurringNow?: () => void;
  language?: Language;
  theme?: Theme;
}

export default function RecurringManager({
  rules = [],
  recurringRules,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onGenerateTransactions,
  onSyncRecurringNow,
  language = 'zh',
  theme = 'light'
}: RecurringManagerProps) {
  const activeRules = rules.length > 0 ? rules : (recurringRules || []);
  const isDark = theme === 'dark';
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('NTD');
  const [category, setCategory] = useState('Housing');
  const [subcategory, setSubcategory] = useState('House Rent');
  const [dayOfMonth, setDayOfMonth] = useState<number>(5);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [note, setNote] = useState('');

  const currencies: CurrencyCode[] = ['NTD', 'USD', 'JPY', 'EUR', 'HKD', 'CNY'];

  const resetForm = () => {
    setTitle('');
    setType('expense');
    setAmount('');
    setCurrency('NTD');
    setCategory('Housing');
    setSubcategory('House Rent');
    setDayOfMonth(5);
    setNote('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (rule: RecurringRule) => {
    setEditingId(rule.id);
    setTitle(rule.title);
    setType(rule.type);
    setAmount(String(rule.amount));
    setCurrency(rule.currency || 'NTD');
    setCategory(rule.category);
    setSubcategory(rule.subcategory || '');
    setDayOfMonth(rule.dayOfMonth);
    setStartDate(rule.startDate || rule.startMonth || '2026-03');
    setNote(rule.note || '');
    setIsAdding(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert(t(language, 'fillRequired'));
      return;
    }

    if (editingId) {
      onUpdateRule({
        id: editingId,
        title,
        type,
        amount: Number(amount),
        currency,
        category,
        subcategory,
        dayOfMonth: Number(dayOfMonth),
        startDate,
        startMonth: startDate,
        isActive: true,
        note
      });
    } else {
      onAddRule({
        title,
        type,
        amount: Number(amount),
        currency,
        category,
        subcategory,
        dayOfMonth: Number(dayOfMonth),
        startDate,
        startMonth: startDate,
        isActive: true,
        note
      });
    }

    resetForm();
  };

  const handleManualTrigger = () => {
    const nowMonthStr = new Date().toISOString().substring(0, 7);
    if (onGenerateTransactions) {
      onGenerateTransactions(nowMonthStr);
    } else if (onSyncRecurringNow) {
      onSyncRecurringNow();
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-24 pt-10 px-4 h-full scrollbar-none transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(language, 'recurringTitle')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'recurringSubtitle')}
          </p>
        </div>
        <button
          onClick={handleManualTrigger}
          className="flex items-center space-x-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all active:scale-95 shrink-0"
        >
          <Zap size={14} />
          <span>{t(language, 'generateNowBtn')}</span>
        </button>
      </div>

      {/* Historical Protection Mechanism Explanation Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-4 flex items-start space-x-2.5">
        <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-400 leading-relaxed font-medium">
          {t(language, 'amountChangeNotice')}
        </p>
      </div>

      {/* Add / Edit Form Modal / Card */}
      {isAdding ? (
        <form onSubmit={handleSubmit} className={`rounded-3xl p-4 shadow-xl border mb-5 transition-all ${
          isDark ? 'bg-slate-800 border-blue-500/40' : 'bg-white border-blue-200'
        }`}>
          <div className="flex justify-between items-center mb-3 border-b border-gray-500/10 pb-2">
            <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Repeat size={16} className="text-blue-500" />
              {editingId ? t(language, 'editRecurringBtn') : t(language, 'addRecurringBtn')}
            </h2>
            <button 
              type="button" 
              onClick={resetForm} 
              className="p-1 text-gray-400 hover:text-rose-500"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t(language, 'ruleTitleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(language, 'ruleTitlePlaceholder')}
                className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none ${
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>

            {/* Type & Currency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t(language, 'expenseTab')} / {t(language, 'incomeTab')}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  <option value="expense">{t(language, 'expenseTab')}</option>
                  <option value="income">{t(language, 'incomeTab')}</option>
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t(language, 'currencyLabel')}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  {currencies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {t(language, 'amountLabel')} ({currency})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full p-2.5 rounded-xl text-xs font-black border focus:outline-none ${
                  isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}
                required
              />
            </div>

            {/* Execution Day & Start Month */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t(language, 'recurringDayLabel')}
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {language === 'zh' ? `每月 ${d} 日` : `Day ${d}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {t(language, 'startMonthLabel')}
                </label>
                <input
                  type="month"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border ${
                  isDark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-600'
                }`}
              >
                {t(language, 'cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                {t(language, 'saveRecurringBtn')}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3 mb-4 rounded-2xl border-2 border-dashed border-blue-500/40 hover:border-blue-500 text-blue-500 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all bg-blue-500/5 hover:bg-blue-500/10"
        >
          <Plus size={16} />
          <span>{t(language, 'addRecurringBtn')}</span>
        </button>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {activeRules.length === 0 ? (
          <div className={`rounded-3xl p-8 text-center border shadow-sm ${
            isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-white border-gray-100 text-gray-400'
          }`}>
            <Repeat size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">{t(language, 'noRecurringRules')}</p>
          </div>
        ) : (
          activeRules.map(rule => (
            <div key={rule.id} className={`rounded-2xl p-3.5 shadow-sm border transition-all ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
            }`}>
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mr-1.5 ${
                    rule.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {rule.type === 'income' ? t(language, 'incomeTab') : t(language, 'expenseTab')}
                  </span>
                  <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {rule.title}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleStartEdit(rule)}
                    className="text-xs font-semibold text-blue-500 hover:underline px-1.5 py-0.5"
                  >
                    {t(language, 'editRecurringBtn')}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t(language, 'deleteRuleConfirm'))) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="text-gray-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="text-[11px] space-y-0.5 text-gray-400 font-medium">
                  <div className="flex items-center space-x-1">
                    <Calendar size={13} className="text-blue-500" />
                    <span>{language === 'zh' ? `每月 ${rule.dayOfMonth} 日扣款` : `Monthly on Day ${rule.dayOfMonth}`}</span>
                  </div>
                  <div>
                    {language === 'zh' ? '生效起算月份' : 'Start Month'}: <span className="font-bold">{rule.startDate || rule.startMonth || '2026-03'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-base font-black ${
                    rule.type === 'income' ? 'text-emerald-500' : isDark ? 'text-slate-100' : 'text-gray-900'
                  }`}>
                    {rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount, rule.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
