import { useState } from 'react';
import type { FormEvent } from 'react';
import type { UserAccount, Language, Theme, ExchangeRates } from '../types';
import { DEFAULT_EXCHANGE_RATES } from '../utils';
import { t } from '../i18n';
import { 
  User, Sun, Moon, Globe, Cloud, RefreshCw, LogOut, ShieldCheck, 
  Trash2, Mail, Lock, Sparkles, X, DollarSign
} from 'lucide-react';

interface SettingsProps {
  user: UserAccount | null;
  language: Language;
  theme: Theme;
  totalMonthlyBudget: number;
  transactionsCount: number;
  exchangeRates?: ExchangeRates;
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onSync: () => void;
  onRestore: () => void;
  onResetData: () => void;
  onLanguageChange: (lang: Language) => void;
  onThemeChange: (theme: Theme) => void;
  onUpdateExchangeRates?: (newRates: ExchangeRates) => void;
}

export default function Settings({
  user,
  language,
  theme,
  totalMonthlyBudget,
  transactionsCount,
  exchangeRates = DEFAULT_EXCHANGE_RATES,
  onLogin,
  onLogout,
  onSync,
  onRestore,
  onResetData,
  onLanguageChange,
  onThemeChange,
  onUpdateExchangeRates
}: SettingsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Rates editing
  const [rates, setRates] = useState<ExchangeRates>(exchangeRates);
  const [isEditingRates, setIsEditingRates] = useState(false);

  // Action Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleDemoLogin = () => {
    const demoUser: UserAccount = {
      id: 'demo_user_888',
      email: 'alex.demo@example.com',
      name: language === 'zh' ? '記帳小明' : 'Alex Demo',
      avatarEmoji: '🦊',
      createdAt: new Date().toISOString(),
      lastSyncAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onLogin(demoUser);
    setShowAuthModal(false);
    showToast(t(language, 'syncSuccessMsg'));
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@') || !password) {
      setErrorMsg(t(language, 'fillRequired'));
      return;
    }

    const newUser: UserAccount = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      name: name.trim() || (email.split('@')[0]),
      avatarEmoji: authMode === 'register' ? '🚀' : '👤',
      createdAt: new Date().toISOString(),
      lastSyncAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onLogin(newUser);
    setShowAuthModal(false);
    setEmail('');
    setPassword('');
    setName('');
    showToast(authMode === 'register' ? (language === 'zh' ? '🎉 帳號註冊成功！已開啟雲端同步。' : '🎉 Account created & cloud sync active!') : t(language, 'syncSuccessMsg'));
  };

  const handleManualSync = () => {
    onSync();
    showToast(t(language, 'syncSuccessMsg'));
  };

  const handleManualRestore = () => {
    onRestore();
    showToast(t(language, 'restoreSuccessMsg'));
  };

  const handleSaveRates = () => {
    if (onUpdateExchangeRates) {
      onUpdateExchangeRates(rates);
    }
    setIsEditingRates(false);
    showToast(language === 'zh' ? '✅ 匯率設定已更新！' : '✅ Exchange rates updated!');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex-1 overflow-y-auto pb-24 pt-10 px-4 h-full scrollbar-none transition-colors duration-200 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xs bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-bounce border border-gray-700">
          <Sparkles size={16} className="text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t(language, 'settingsTitle')}
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'settingsSubtitle')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* ACCOUNT & SYNC SECTION */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck size={18} className="text-blue-500" />
            <h2 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              {t(language, 'accountSectionTitle')}
            </h2>
          </div>

          {user ? (
            /* Logged in view */
            <div className="space-y-3">
              <div className={`p-3 rounded-2xl flex items-center space-x-3 border ${
                isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-blue-50/60 border-blue-100'
              }`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-2xl text-white shadow-md shadow-blue-500/20">
                  {user.avatarEmoji || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                      Sync On
                    </span>
                  </div>
                  <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t(language, 'lastSynced')}: {user.lastSyncAt} • {transactionsCount} {language === 'zh' ? '筆明細' : 'entries'}
                  </p>
                </div>
              </div>

              {/* Action Buttons for Logged in User */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  className="flex items-center justify-center space-x-1.5 p-2.5 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Cloud size={15} />
                  <span>{t(language, 'syncNowBtn')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualRestore}
                  className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-2xl font-bold text-xs border active:scale-95 transition-all ${
                    isDark 
                      ? 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600' 
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <RefreshCw size={15} />
                  <span>{t(language, 'restoreNowBtn')}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className={`w-full flex items-center justify-center space-x-1.5 p-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors ${
                  isDark ? 'hover:bg-rose-500/20' : ''
                }`}
              >
                <LogOut size={14} />
                <span>{t(language, 'logoutBtn')}</span>
              </button>
            </div>
          ) : (
            /* Guest / Logged out view */
            <div className="space-y-3">
              <div className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-700/40 border-slate-700' : 'bg-amber-50/70 border-amber-200/80'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xl">👤</span>
                  <h3 className={`font-bold text-sm ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                    {t(language, 'guestUserTitle')}
                  </h3>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-amber-800'}`}>
                  {t(language, 'guestUserDesc')}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  <User size={16} />
                  <span>{t(language, 'loginPromptBtn')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold border flex items-center justify-center space-x-1.5 active:scale-[0.98] transition-all ${
                    isDark 
                      ? 'bg-slate-700/80 text-amber-300 border-slate-600 hover:bg-slate-700' 
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sparkles size={15} className="text-amber-500" />
                  <span>{t(language, 'demoLoginBtn')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PREFERENCES SECTION (THEME & LANGUAGE) */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-gray-100'
        }`}>
          <h2 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t(language, 'preferencesTitle')}
          </h2>

          <div className="space-y-4">
            {/* Theme Toggle */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t(language, 'themeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onThemeChange('light')}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                    theme === 'light'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Sun size={16} />
                  <span>{t(language, 'lightMode')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onThemeChange('dark')}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Moon size={16} />
                  <span>{t(language, 'darkMode')}</span>
                </button>
              </div>
            </div>

            {/* Language Toggle */}
            <div>
              <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t(language, 'languageLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLanguageChange('zh')}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                    language === 'zh'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">🇹🇼</span>
                  <span>{t(language, 'zhLang')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-2xl border font-bold text-xs transition-all ${
                    language === 'en'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : isDark
                        ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-base">🇺🇸</span>
                  <span>{t(language, 'enLang')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EXCHANGE RATES SETTINGS CARD */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <DollarSign size={18} className="text-blue-500" />
              <h2 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {language === 'zh' ? '匯率換算參考設定' : 'Exchange Rates Config'}
              </h2>
            </div>
            <button
              onClick={() => setIsEditingRates(!isEditingRates)}
              className="text-xs font-bold text-blue-500 hover:underline"
            >
              {isEditingRates ? (language === 'zh' ? '取消' : 'Cancel') : (language === 'zh' ? '編輯匯率' : 'Edit Rates')}
            </button>
          </div>

          {isEditingRates ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">USD (美金對NTD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.USD}
                    onChange={(e) => setRates({ ...rates, USD: parseFloat(e.target.value) || 1 })}
                    className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">JPY (日幣對NTD)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={rates.JPY}
                    onChange={(e) => setRates({ ...rates, JPY: parseFloat(e.target.value) || 1 })}
                    className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">EUR (歐元對NTD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.EUR}
                    onChange={(e) => setRates({ ...rates, EUR: parseFloat(e.target.value) || 1 })}
                    className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">HKD (港幣對NTD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates.HKD}
                    onChange={(e) => setRates({ ...rates, HKD: parseFloat(e.target.value) || 1 })}
                    className={`w-full p-2 rounded-xl border font-bold ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveRates}
                className="w-full mt-2 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                {language === 'zh' ? '儲存最新匯率' : 'Save Rates'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
              <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 block font-sans">1 USD =</span>
                <span className="font-extrabold">{rates.USD} NTD</span>
              </div>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 block font-sans">1 JPY =</span>
                <span className="font-extrabold">{rates.JPY} NTD</span>
              </div>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <span className="text-[10px] text-gray-400 block font-sans">1 EUR =</span>
                <span className="font-extrabold">{rates.EUR} NTD</span>
              </div>
            </div>
          )}
        </div>

        {/* BUDGET SUMMARY CARD */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-gray-100'
        }`}>
          <h2 className={`text-xs font-black uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t(language, 'budgetOverviewTitle')}
          </h2>
          <div className="flex items-baseline justify-between mb-1">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              {t(language, 'budgetTotalLabel')}
            </span>
            <span className={`text-lg font-black ${isDark ? 'text-emerald-400' : 'text-gray-900'}`}>
              NT$ {totalMonthlyBudget.toLocaleString()}
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
            {t(language, 'budgetNote')}
          </p>
        </div>

        {/* DATA MANAGEMENT */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white border-gray-100'
        }`}>
          <h2 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
            {t(language, 'dataManagementTitle')}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t(language, 'confirmResetAlert'))) {
                onResetData();
                showToast(t(language, 'resetSuccessAlert'));
              }
            }}
            className={`w-full flex items-center justify-center space-x-2 p-3 rounded-2xl border font-bold text-xs text-rose-500 hover:bg-rose-500/10 active:scale-98 transition-all ${
              isDark ? 'border-rose-500/30' : 'border-rose-200'
            }`}
          >
            <Trash2 size={16} />
            <span>{t(language, 'resetDemoDataBtn')}</span>
          </button>
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border ${
            isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-100'
          }`}>
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                🔒
              </div>
              <h3 className="text-lg font-black">
                {authMode === 'login' ? t(language, 'modalTitleLogin') : t(language, 'modalTitleRegister')}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                {t(language, 'modalSubText')}
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold mb-1">{t(language, 'nameLabel')}</label>
                  <div className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <User size={16} className="text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t(language, 'namePlaceholder')}
                      className="bg-transparent text-xs w-full outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold mb-1">{t(language, 'emailLabel')}</label>
                <div className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <Mail size={16} className="text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t(language, 'emailPlaceholder')}
                    className="bg-transparent text-xs w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">{t(language, 'passwordLabel')}</label>
                <div className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <Lock size={16} className="text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t(language, 'passwordPlaceholder')}
                    className="bg-transparent text-xs w-full outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all mt-2"
              >
                {authMode === 'login' ? t(language, 'loginSubmit') : t(language, 'registerSubmit')}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                }}
                className="text-xs font-bold text-blue-500 hover:underline"
              >
                {authMode === 'login' ? t(language, 'switchRegister') : t(language, 'switchLogin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
