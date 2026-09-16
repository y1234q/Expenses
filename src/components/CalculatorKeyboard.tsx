import React, { useState, useEffect } from 'react';
import { Delete, Check, X, Divide, Plus, Minus } from 'lucide-react';
import { CurrencyCode } from '../types';

interface CalculatorKeyboardProps {
  initialValue: string;
  currency: CurrencyCode;
  isDark?: boolean;
  onConfirm: (finalAmount: string) => void;
  onClose: () => void;
}

// Safely evaluates arithmetic expressions like "120 + 35 * 2"
function safeCalculate(expression: string): number | null {
  try {
    const sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-');

    if (!/^[0-9+\-*/. ]+$/.test(sanitized)) {
      return null;
    }

    if (/[+\-*/]$/.test(sanitized.trim())) {
      const withoutTrailing = sanitized.trim().slice(0, -1);
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${withoutTrailing})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100;
      }
      return null;
    }

    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${sanitized})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

export const CalculatorKeyboard: React.FC<CalculatorKeyboardProps> = ({
  initialValue,
  currency,
  isDark = false,
  onConfirm,
  onClose,
}) => {
  const [expression, setExpression] = useState<string>(() => {
    const trimmed = initialValue?.trim() || '';
    return trimmed && Number(trimmed) > 0 ? trimmed : '';
  });

  const previewResult = expression ? safeCalculate(expression) : null;

  const handleDigit = (digit: string) => {
    setExpression((prev) => {
      if (!prev && digit === '00') return '0';
      if (prev === '0' && digit !== '.') return digit;

      const tokens = prev.split(/[\+\-\×\÷]/);
      const currentToken = tokens[tokens.length - 1];
      if (digit === '.' && currentToken.includes('.')) {
        return prev;
      }
      if (digit === '.' && (!currentToken || currentToken === '')) {
        return prev + '0.';
      }

      return prev + digit;
    });
  };

  const handleOperator = (op: '+' | '−' | '×' | '÷') => {
    setExpression((prev) => {
      if (!prev) {
        if (op === '−') return '−';
        return '';
      }
      if (/[\+\−\×\÷]$/.test(prev)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const handleBackspace = () => {
    setExpression((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
  };

  const handleClear = () => {
    setExpression('');
  };

  const handleEqual = () => {
    if (!expression) return;
    const res = safeCalculate(expression);
    if (res !== null) {
      setExpression(String(res));
    }
  };

  const handleDone = () => {
    if (!expression) {
      onConfirm('');
      onClose();
      return;
    }
    const res = safeCalculate(expression);
    if (res !== null && res >= 0) {
      onConfirm(String(res));
    } else if (/^\d+(\.\d+)?$/.test(expression)) {
      onConfirm(expression);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDigit('.');
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('−');
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleDone();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression]);

  const hasPendingOperation = /[\+\−\×\÷]/.test(expression);

  return (
    <div
      id="custom-calculator-overlay"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45 backdrop-blur-[2px] animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDone();
        }
      }}
    >
      <div
        id="custom-calculator-sheet"
        className={`w-full max-w-md mx-auto rounded-t-[28px] border-t shadow-2xl p-4 pb-7 transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-500/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
              {currency} 計算機
            </span>
            {hasPendingOperation && previewResult !== null && (
              <span className="text-xs text-gray-400 font-medium">
                = {previewResult}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Calculator Display */}
        <div
          className={`px-4 py-3 rounded-2xl mb-3 flex flex-col items-end justify-center min-h-[72px] border ${
            isDark
              ? 'bg-slate-800/80 border-slate-700'
              : 'bg-gray-50 border-gray-100'
          }`}
        >
          <div className="text-xs text-gray-400 font-semibold tracking-wider flex items-center gap-1">
            <span>{currency}</span>
            {hasPendingOperation && (
              <span className="text-blue-500 font-bold ml-1">
                即時結果: {previewResult !== null ? previewResult : '...'}
              </span>
            )}
          </div>
          <div className="text-3xl font-black tracking-tight overflow-x-auto w-full text-right scrollbar-none">
            {expression || '0'}
          </div>
        </div>

        {/* Calculator Buttons Grid (4 x 5 layout like standard mobile calculators) */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            type="button"
            onClick={handleClear}
            className={`h-13 rounded-2xl text-base font-black transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-rose-400'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
            }`}
          >
            AC
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Delete size={20} />
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <Divide size={22} />
          </button>
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className={`h-13 rounded-2xl text-xl font-black transition-all active:scale-95 ${
              isDark
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            ×
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleDigit('7')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleDigit('8')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleDigit('9')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('−')}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <Minus size={22} />
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleDigit('4')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleDigit('5')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleDigit('6')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className={`h-13 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
              isDark
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <Plus size={22} />
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleDigit('1')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleDigit('2')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleDigit('3')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            3
          </button>
          <button
            type="button"
            onClick={handleEqual}
            className={`h-13 rounded-2xl text-2xl font-black transition-all active:scale-95 ${
              isDark
                ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/40 border border-blue-500/30'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            =
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className={`h-13 rounded-2xl text-xl font-bold transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit('.')}
            className={`h-13 rounded-2xl text-2xl font-black transition-all active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-white'
                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-xs'
            }`}
          >
            .
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="col-span-2 h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-base shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Check size={20} />
            <span>完成</span>
          </button>
        </div>
      </div>
    </div>
  );
};
