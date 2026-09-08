import React, { useState, useEffect } from 'react';
import { ShieldCheck, Key, X, Lock, Eye, EyeOff, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { verifyAdminPassword, createAdminSession, logSecurityAudit } from '../utils/security';
import { apiAdmin } from '../utils/api';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/rateLimiter';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  onShowToast: (msg: string) => void;
}

const RATE_LIMIT_KEY = 'admin_master_login';
const MAX_ATTEMPTS = 5;

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_ATTEMPTS);

  // Sync rate limit status on open
  useEffect(() => {
    if (isOpen) {
      const status = checkRateLimit(RATE_LIMIT_KEY, MAX_ATTEMPTS);
      setRemainingAttempts(status.remainingAttempts);
      setLockoutSeconds(status.lockoutSecondsLeft);
      setError('');
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          const status = checkRateLimit(RATE_LIMIT_KEY, MAX_ATTEMPTS);
          setRemainingAttempts(status.remainingAttempts);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  if (!isOpen) return null;

  const isLockedOut = lockoutSeconds > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || isLockedOut) return;

    if (!password.trim()) {
      setError('Введите пароль администратора');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Cryptographic salted hash verification
      const isValid = await verifyAdminPassword(password);

      if (isValid) {
        // Issue server-side admin token (required for protected API mutations)
        const serverOk = await apiAdmin.login(password);
        if (!serverOk) {
          setError('Сервер не принял ключ администратора. Повторите попытку.');
          setIsVerifying(false);
          return;
        }

        // Reset rate limiter
        resetRateLimit(RATE_LIMIT_KEY);
        // Create cryptographically signed admin session with TTL
        await createAdminSession();
        logSecurityAudit('admin_login_success', 'Успешный вход в панель администратора');

        onLoginSuccess();
        onShowToast('Режим администратора успешно активирован! Сессия защищена.');
        setPassword('');
        setError('');
        onClose();
      } else {
        // Record failed attempt and trigger exponential lockout if exceeded
        const result = recordFailedAttempt(RATE_LIMIT_KEY, MAX_ATTEMPTS);
        setRemainingAttempts(Math.max(0, MAX_ATTEMPTS - result.attemptsCount));

        if (result.isLockedOut) {
          setLockoutSeconds(result.lockoutSeconds);
          logSecurityAudit(
            'rate_limit_lockout',
            `Блокировка попыток входа администратора на ${result.lockoutSeconds} сек. (5+ неудачных попыток)`
          );
          setError(`Слишком много неверных попыток! Доступ заблокирован на ${result.lockoutSeconds} сек.`);
        } else {
          logSecurityAudit('admin_login_failed', `Неудачная попытка входа с неверным паролем`);
          const left = MAX_ATTEMPTS - result.attemptsCount;
          setError(`Неверный ключ администратора. Осталось попыток: ${left}`);
        }
      }
    } catch {
      setError('Ошибка криптографической проверки. Повторите попытку.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#121212] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-gradient-to-b from-[#1c160c] to-[#121212]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                <span>Панель администратора</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SHA-256
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Защищенный шлюз с защитой от подбора паролей
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Lockout banner */}
          {isLockedOut && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-red-300 block">
                  Временная блокировка подбора (Brute-force protection)
                </span>
                <p className="text-[11px] text-red-200/90 leading-relaxed">
                  Превышен лимит попыток. Повторный ввод ключа будет доступен через{' '}
                  <strong className="text-white font-mono">{lockoutSeconds} сек.</strong>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-300">
                Мастер-ключ администратора
              </label>
              {!isLockedOut && remainingAttempts < MAX_ATTEMPTS && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  Попыток осталось: {remainingAttempts}
                </span>
              )}
            </div>

            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                disabled={isLockedOut || isVerifying}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={isLockedOut ? 'Подождите окончания таймера...' : 'Введите пароль администратора'}
                className="w-full bg-[#181818] border border-white/15 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all disabled:opacity-50 shadow-inner"
              />
              <button
                type="button"
                disabled={isLockedOut}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors p-1"
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium pt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-neutral-400 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Стандарты безопасности LatzLand</span>
            </div>
            <p className="leading-relaxed">
              Пароли валидируются с использованием криптографического солевого хэширования SHA-256. Вход логируется в журнал аудита.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLockedOut || isVerifying || !password.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-4 h-4 stroke-[2.5]" />
              <span>{isVerifying ? 'Проверка ключа...' : 'Авторизоваться как администратор'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
