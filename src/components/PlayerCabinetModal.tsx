import React, { useState, useEffect } from 'react';
import {
  User,
  X,
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Hammer,
  Edit3,
  Check,
  LogIn,
  LogOut,
  ChevronRight,
  Wifi,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  ProposalItem,
  LatzEvent,
  MegaProject,
  PlayerProfile,
  MinecraftServerStatus,
  EVENT_CATEGORIES,
} from '../types';
import {
  getMinecraftHeadUrl,
  getPlayerColor,
} from '../utils/playerUtils';
import {
  hashPlayerPassword,
  verifyPlayerPassword,
  evaluatePasswordStrength,
  logSecurityAudit,
} from '../utils/security';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '../utils/rateLimiter';
import { validateMinecraftNick, sanitizeText } from '../utils/sanitizer';

interface PlayerCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayerNick: string | null;
  onSetActivePlayerNick: (nick: string | null) => void;
  proposals: ProposalItem[];
  events: LatzEvent[];
  projects: MegaProject[];
  playersDatabase: PlayerProfile[];
  serverStatus?: MinecraftServerStatus;
  onDeleteMyProposal: (proposalId: string) => void;
  onOpenAddEventProposal: (prefilledNick: string) => void;
  onOpenAddProjectProposal: (prefilledNick: string) => void;
  onJumpToEvent: (eventId: string) => void;
  onJumpToProject: (projectId: string) => void;
  onUpdatePlayerProfile: (updated: PlayerProfile) => void;
  onShowToast: (msg: string) => void;
}

export const PlayerCabinetModal: React.FC<PlayerCabinetModalProps> = ({
  isOpen,
  onClose,
  activePlayerNick,
  onSetActivePlayerNick,
  proposals,
  events,
  projects,
  playersDatabase,
  serverStatus,
  onDeleteMyProposal,
  onOpenAddEventProposal,
  onOpenAddProjectProposal,
  onJumpToEvent,
  onJumpToProject,
  onUpdatePlayerProfile,
  onShowToast,
}) => {
  // Auth state
  const [nickInput, setNickInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Password strength
  const passStrength = evaluatePasswordStrength(passwordInput);

  const [activeTab, setActiveTab] = useState<'proposals' | 'events' | 'projects' | 'profile'>('proposals');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Profile editing inside cabinet
  const [editRole, setEditRole] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editHomeCoords, setEditHomeCoords] = useState('');

  // Password change in profile tab
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmNewPassInput, setConfirmNewPassInput] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [changePassError, setChangePassError] = useState('');
  const [isSubmittingNewPass, setIsSubmittingNewPass] = useState(false);

  const newPassStrength = evaluatePasswordStrength(newPassInput);

  // Sync lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const currentNick = activePlayerNick?.trim() || '';

  // Current player profile in database if any
  const currentPlayerProfile = playersDatabase.find(
    (p) => p.username.toLowerCase() === currentNick.toLowerCase()
  );

  // Sync edit fields when profile changes
  useEffect(() => {
    if (currentPlayerProfile) {
      setEditRole(currentPlayerProfile.role || '');
      setEditDesc(currentPlayerProfile.description || '');
      setEditColor(currentPlayerProfile.color || getPlayerColor(currentNick));
      setEditDiscord(currentPlayerProfile.discord || '');
      setEditTelegram(currentPlayerProfile.telegram || '');
      const hc = currentPlayerProfile.homeCoordinates;
      setEditHomeCoords(
        typeof hc === 'string' ? hc : hc ? `X: ${hc.x}, Y: ${hc.y}, Z: ${hc.z}` : ''
      );
    } else if (currentNick) {
      setEditRole('Игрок');
      setEditDesc('');
      setEditColor(getPlayerColor(currentNick));
      setEditDiscord('');
      setEditTelegram('');
      setEditHomeCoords('');
    }
  }, [currentPlayerProfile, currentNick]);

  if (!isOpen) return null;

  // Filter proposals submitted by current user
  const myProposals = proposals.filter(
    (p) => p.submittedBy.toLowerCase() === currentNick.toLowerCase()
  );

  const myPendingProposals = myProposals.filter((p) => p.status === 'pending');
  const myApprovedProposals = myProposals.filter((p) => p.status === 'approved');
  const myRejectedProposals = myProposals.filter((p) => p.status === 'rejected');

  const filteredProposals = myProposals.filter((p) => {
    if (proposalStatusFilter === 'all') return true;
    return p.status === proposalStatusFilter;
  });

  // Filter events mentioning current user
  const myEvents = events.filter((e) =>
    e.players?.some((p) => p.toLowerCase() === currentNick.toLowerCase())
  );

  // Filter projects built by current user
  const myProjects = projects.filter((p) =>
    p.builders?.some((b) => b.toLowerCase() === currentNick.toLowerCase())
  );

  // Check online status
  const isOnline = Boolean(
    serverStatus?.online &&
      serverStatus?.playerList?.some(
        (p) => p.toLowerCase() === currentNick.toLowerCase()
      )
  );

  // Auth Handler: Login with password or register with password
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAuth || lockoutSeconds > 0) return;

    setAuthError('');
    const rawNick = nickInput.trim();
    const rawPass = passwordInput;

    // Validate Nickname with Mojang standards
    const nickValidation = validateMinecraftNick(rawNick);
    if (!nickValidation.valid) {
      setAuthError(nickValidation.errorMessage || 'Некорректный никнейм Minecraft');
      return;
    }
    const cleanNick = nickValidation.cleanNick;

    if (!rawPass) {
      setAuthError('Пожалуйста, введите пароль для входа');
      return;
    }

    const rateLimitKey = `player_login_${cleanNick.toLowerCase()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 60000);
    if (!rateCheck.allowed) {
      setLockoutSeconds(rateCheck.lockoutSecondsLeft);
      setAuthError(`Слишком много неверных попыток. Подождите ${rateCheck.lockoutSecondsLeft} сек.`);
      return;
    }

    setIsSubmittingAuth(true);

    try {
      const existingPlayer = playersDatabase.find(
        (p) => p.username.toLowerCase() === cleanNick.toLowerCase()
      );

      if (authMode === 'login') {
        if (existingPlayer && existingPlayer.password) {
          // Cryptographic password verification with auto-upgrade
          const verResult = await verifyPlayerPassword(rawPass, existingPlayer.password, cleanNick);
          if (!verResult.valid) {
            const fail = recordFailedAttempt(rateLimitKey, 5, 60000);
            if (fail.isLockedOut) {
              setLockoutSeconds(fail.lockoutSeconds);
              logSecurityAudit('rate_limit_lockout', `Блокировка попыток входа для игрока ${cleanNick}`);
              setAuthError(`Слишком много неверных попыток. Блокировка на ${fail.lockoutSeconds} сек.`);
            } else {
              logSecurityAudit('player_login_failed', `Неудачная попытка входа для игрока ${cleanNick}`);
              setAuthError(`Неверный пароль. Осталось попыток: ${5 - fail.attemptsCount}`);
            }
            return;
          }

          // If legacy plaintext password detected, auto-upgrade to hashed password
          if (verResult.needsRehash && verResult.newHash) {
            onUpdatePlayerProfile({
              ...existingPlayer,
              password: verResult.newHash,
            });
          }
        } else if (existingPlayer && !existingPlayer.password) {
          // Existing player without password: hash and set new password
          const hashedPassword = await hashPlayerPassword(rawPass, cleanNick);
          onUpdatePlayerProfile({
            ...existingPlayer,
            password: hashedPassword,
          });
        } else {
          // Not in DB yet
          setAuthError('Игрок с никнеймом «' + cleanNick + '» не найден в базе. Перейдите во вкладку «Регистрация».');
          return;
        }

        resetRateLimit(rateLimitKey);
        logSecurityAudit('player_login_success', `Игрок ${existingPlayer?.username || cleanNick} вошел в кабинет`);

        onSetActivePlayerNick(existingPlayer?.username || cleanNick);
        onShowToast(`Добро пожаловать в личный кабинет, ${existingPlayer?.username || cleanNick}!`);
        setNickInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setAuthError('');
      } else {
        // Registration mode
        if (rawPass.length < 4) {
          setAuthError('Пароль должен содержать не менее 4 символов');
          return;
        }
        if (rawPass !== confirmPasswordInput) {
          setAuthError('Пароли не совпадают. Проверьте подтверждение пароля');
          return;
        }

        if (existingPlayer && existingPlayer.password) {
          setAuthError('Игрок с ником «' + cleanNick + '» уже зарегистрирован. Перейдите во вкладку «Вход с паролем»');
          return;
        }

        // Salted hash for new registration
        const hashedPassword = await hashPlayerPassword(rawPass, cleanNick);

        if (existingPlayer) {
          onUpdatePlayerProfile({
            ...existingPlayer,
            password: hashedPassword,
            registeredAt: existingPlayer.registeredAt || new Date().toISOString().split('T')[0],
          });
        } else {
          const newProfile: PlayerProfile = {
            id: `player-${cleanNick.toLowerCase()}`,
            username: cleanNick,
            role: 'Игрок',
            description: '',
            color: getPlayerColor(cleanNick),
            password: hashedPassword,
            registeredAt: new Date().toISOString().split('T')[0],
          };
          onUpdatePlayerProfile(newProfile);
        }

        resetRateLimit(rateLimitKey);
        logSecurityAudit('player_register', `Зарегистрирован новый профиль игрока ${cleanNick}`);

        onSetActivePlayerNick(existingPlayer?.username || cleanNick);
        onShowToast(`Аккаунт ${existingPlayer?.username || cleanNick} успешно создан и защищен!`);
        setNickInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setAuthError('');
      }
    } catch {
      setAuthError('Ошибка безопасности при обработке пароля');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    onSetActivePlayerNick(null);
    setNickInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setAuthError('');
    setIsChangingPass(false);
    onShowToast('Вы вышли из личного кабинета');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNick) return;

    // Sanitize all text fields to block XSS and malicious payloads
    const updatedProfile: PlayerProfile = {
      id: currentPlayerProfile?.id || `player-${currentNick.toLowerCase()}`,
      username: currentNick,
      role: sanitizeText(editRole) || 'Игрок',
      description: sanitizeText(editDesc),
      color: editColor || getPlayerColor(currentNick),
      discord: sanitizeText(editDiscord) || undefined,
      telegram: sanitizeText(editTelegram) || undefined,
      homeCoordinates: sanitizeText(editHomeCoords) || undefined,
      registeredAt: currentPlayerProfile?.registeredAt || new Date().toISOString().split('T')[0],
      password: currentPlayerProfile?.password,
    };

    onUpdatePlayerProfile(updatedProfile);
    onShowToast('Паспорт игрока успешно сохранен в базе данных!');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingNewPass) return;
    setChangePassError('');

    if (!currentNick || !currentPlayerProfile) return;

    const currentActualPass = currentPlayerProfile.password;
    const cleanCurrent = currentPassInput;
    const cleanNew = newPassInput;
    const cleanConfirm = confirmNewPassInput;

    if (currentActualPass) {
      const verifyOld = await verifyPlayerPassword(cleanCurrent, currentActualPass, currentNick);
      if (!verifyOld.valid) {
        setChangePassError('Текущий пароль введен неверно');
        return;
      }
    }

    if (cleanNew.length < 4) {
      setChangePassError('Новый пароль должен содержать от 4 символов');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setChangePassError('Новые пароли не совпадают');
      return;
    }

    setIsSubmittingNewPass(true);

    try {
      const hashedNew = await hashPlayerPassword(cleanNew, currentNick);

      onUpdatePlayerProfile({
        ...currentPlayerProfile,
        password: hashedNew,
      });

      logSecurityAudit('password_change', `Игрок ${currentNick} изменил пароль кабинета`);

      setIsChangingPass(false);
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmNewPassInput('');
      setChangePassError('');
      onShowToast('Пароль от личного кабинета успешно обновлен (SHA-256)!');
    } catch {
      setChangePassError('Ошибка криптографического шифрования пароля');
    } finally {
      setIsSubmittingNewPass(false);
    }
  };

  const handleRevokeProposal = (id: string, title: string) => {
    if (window.confirm(`Вы уверены, что хотите отозвать заявку «${title}»?`)) {
      onDeleteMyProposal(id);
      onShowToast('Заявка отозвана');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#121212] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-neutral-200">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-[#0e1d24] to-[#121212] border-b border-cyan-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0 overflow-hidden">
              {currentNick ? (
                <img
                  src={getMinecraftHeadUrl(currentNick, 40)}
                  alt={currentNick}
                  className="w-8 h-8 rounded image-render-pixelated"
                />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Личный кабинет игрока
                </h2>
                {currentNick && (
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    @{currentNick}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                {currentNick
                  ? 'Отслеживание поданных заявок в летопись, история участия и профиль'
                  : 'Безопасный вход по никнейму и паролю'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentNick && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 text-neutral-300 hover:text-red-300 text-xs transition-all"
                title="Выйти из кабинета"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Выйти</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Not Logged In Screen: Login / Registration with Password */}
        {!currentNick ? (
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto space-y-5 flex flex-col justify-center max-w-lg mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 mx-auto flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white">Вход в Личный кабинет</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Введите никнейм Minecraft и пароль для доступа к управлению заявками и профилем.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-[#181818] p-1 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Вход с паролем</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-cyan-500 text-black shadow-sm font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Новый игрок / Регистрация</span>
              </button>
            </div>

            {/* Password Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {/* Lockout Notice */}
              {lockoutSeconds > 0 && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-red-300 block">
                      Временная блокировка подбора пароля
                    </span>
                    <p className="text-[11px] text-red-200/90 leading-relaxed">
                      Превышено количество попыток. Повторный ввод будет доступен через{' '}
                      <strong className="text-white font-mono">{lockoutSeconds} сек.</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Nickname input */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-300">
                  Никнейм в Minecraft
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    disabled={lockoutSeconds > 0 || isSubmittingAuth}
                    value={nickInput}
                    onChange={(e) => {
                      setNickInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Например: Weistel или Alex_Miner"
                    className="w-full pl-9 pr-12 py-2.5 rounded-xl bg-[#181818] border border-white/15 focus:border-cyan-400 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none transition-all shadow-inner disabled:opacity-50"
                    autoFocus
                  />
                  {nickInput.trim() && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded bg-black/40 flex items-center justify-center overflow-hidden border border-white/10">
                      <img
                        src={getMinecraftHeadUrl(nickInput.trim(), 28)}
                        alt="Head"
                        className="w-6 h-6 image-render-pixelated"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-neutral-300">
                    Пароль аккаунта
                  </label>
                  {authMode === 'register' && passwordInput && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${passStrength.color}20`,
                        color: passStrength.color,
                      }}
                    >
                      {passStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    disabled={lockoutSeconds > 0 || isSubmittingAuth}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setAuthError('');
                    }}
                    placeholder={
                      authMode === 'login'
                        ? 'Введите пароль вашего аккаунта'
                        : 'Придумайте надежный пароль'
                    }
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#181818] border border-white/15 focus:border-cyan-400 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none transition-all shadow-inner disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={lockoutSeconds > 0}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength meter (in register mode) */}
                {authMode === 'register' && passwordInput && (
                  <div className="pt-1 space-y-1 animate-in fade-in duration-150">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${passStrength.score}%`,
                          backgroundColor: passStrength.color,
                        }}
                      />
                    </div>
                    {passStrength.feedback.length > 0 && (
                      <p className="text-[10px] text-neutral-400">
                        {passStrength.feedback.join(' • ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password (only in register mode) */}
              {authMode === 'register' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="block text-xs font-medium text-neutral-300">
                    Повторите пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={lockoutSeconds > 0 || isSubmittingAuth}
                      value={confirmPasswordInput}
                      onChange={(e) => {
                        setConfirmPasswordInput(e.target.value);
                        setAuthError('');
                      }}
                      placeholder="Повторите придуманный пароль"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#181818] border border-white/15 focus:border-cyan-400 text-white placeholder-neutral-500 text-sm font-medium focus:outline-none transition-all shadow-inner disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Error display */}
              {authError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={lockoutSeconds > 0 || isSubmittingAuth || !nickInput.trim() || !passwordInput}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmittingAuth ? (
                  <span>Проверка безопасности...</span>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Войти в аккаунт</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Зарегистрировать профиль</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-neutral-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-cyan-300 block">База данных игроков LatzLand</span>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  Данные вашего профиля, история заявок и статус синхронизируются с базой данных сервера.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Player Hero Card with Skin, Stats & Quick Actions */}
            <div className="px-5 py-3.5 bg-[#161616] border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 p-1 flex items-center justify-center overflow-hidden shadow-md">
                    <img
                      src={getMinecraftHeadUrl(currentNick, 48)}
                      alt={currentNick}
                      className="w-10 h-10 rounded image-render-pixelated"
                    />
                  </div>
                  {isOnline ? (
                    <span
                      title="Сейчас онлайн на play.latzland.eu"
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#00e676] border-2 border-[#161616] shadow-[0_0_8px_#00e676]"
                    />
                  ) : (
                    <span
                      title="Офлайн"
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-neutral-600 border-2 border-[#161616]"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white">
                      {currentNick}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                      {currentPlayerProfile?.role || 'Игрок'}
                    </span>
                    {isOnline && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        <span>Онлайн</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1 max-w-sm">
                    {currentPlayerProfile?.description || 'Житель и строитель мира LatzLand SMP'}
                  </p>
                </div>
              </div>

              {/* Action Buttons to propose new items */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddEventProposal(currentNick);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,230,118,0.25)]"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Предложить событие</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAddProjectProposal(currentNick);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-200 text-xs font-semibold transition-all"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Предложить стройку</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 py-2 bg-[#121212] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-xs">
              <button
                onClick={() => setActiveTab('proposals')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'proposals'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Мои заявки</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'proposals'
                      ? 'bg-black/20 text-black'
                      : myPendingProposals.length > 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  {myProposals.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'events'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Участие в событиях ({myEvents.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'projects'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Мои стройки ({myProjects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'profile'
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Паспорт и безопасность</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              
              {/* TAB 1: MY PROPOSALS & APPLICATION STATUSES */}
              {activeTab === 'proposals' && (
                <div className="space-y-4">
                  {/* Status summary chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        onClick={() => setProposalStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          proposalStatusFilter === 'all'
                            ? 'bg-white/20 text-white font-bold'
                            : 'bg-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        Все ({myProposals.length})
                      </button>
                      <button
                        onClick={() => setProposalStatusFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          proposalStatusFilter === 'pending'
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>На проверке ({myPendingProposals.length})</span>
                      </button>
                      <button
                        onClick={() => setProposalStatusFilter('approved')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          proposalStatusFilter === 'approved'
                            ? 'bg-emerald-500 text-black font-bold'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Одобрено ({myApprovedProposals.length})</span>
                      </button>
                      <button
                        onClick={() => setProposalStatusFilter('rejected')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          proposalStatusFilter === 'rejected'
                            ? 'bg-red-500 text-white font-bold'
                            : 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Отклонено ({myRejectedProposals.length})</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-neutral-400">
                      Статусы обновляются в реальном времени при модерации
                    </div>
                  </div>

                  {filteredProposals.length === 0 ? (
                    <div className="py-12 text-center bg-[#151515] border border-white/5 rounded-2xl p-6 space-y-3">
                      <Inbox className="w-10 h-10 text-neutral-500 mx-auto" />
                      <h4 className="text-base font-bold text-white">
                        {proposalStatusFilter === 'all'
                          ? 'У вас пока нет отправленных заявок'
                          : `Нет заявок со статусом «${
                              proposalStatusFilter === 'pending'
                                ? 'На проверке'
                                : proposalStatusFilter === 'approved'
                                ? 'Одобрено'
                                : 'Отклонено'
                            }»`}
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto">
                        Вы можете предложить интересное событие, бой, открытие локации или масштабную стройку на сервере.
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAddEventProposal(currentNick);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black text-xs font-bold transition-all"
                        >
                          + Предложить событие
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredProposals.map((proposal) => {
                        const isEvent = proposal.type === 'event';
                        const itemData = isEvent ? proposal.eventData : proposal.projectData;
                        const title = itemData?.title || 'Без названия';
                        const desc = itemData?.description || '';
                        const date = isEvent ? proposal.eventData?.date : null;

                        return (
                          <div
                            key={proposal.id}
                            className={`p-4 rounded-2xl border transition-all space-y-3 ${
                              proposal.status === 'pending'
                                ? 'bg-[#181818] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                                : proposal.status === 'approved'
                                ? 'bg-[#121c15] border-emerald-500/30'
                                : 'bg-[#1c1212] border-red-500/30'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                                    isEvent
                                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  }`}
                                >
                                  {isEvent ? <Calendar className="w-3 h-3" /> : <Hammer className="w-3 h-3" />}
                                  <span>{isEvent ? 'Событие' : 'Стройка'}</span>
                                </span>

                                {/* Status Tag */}
                                {proposal.status === 'pending' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    <span>На проверке у администрации</span>
                                  </span>
                                )}

                                {proposal.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Одобрено и опубликовано</span>
                                  </span>
                                )}

                                {proposal.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/35">
                                    <XCircle className="w-3 h-3" />
                                    <span>Отклонено</span>
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                                <span>{new Date(proposal.submittedAt).toLocaleDateString('ru-RU')}</span>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-1.5">
                              <h5 className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{title}</span>
                                {date && (
                                  <span className="text-[11px] text-neutral-400 font-mono font-normal">
                                    ({date})
                                  </span>
                                )}
                              </h5>
                              <p className="text-xs text-neutral-300 line-clamp-2">{desc}</p>
                            </div>

                            {/* Rejection comment if any */}
                            {proposal.status === 'rejected' && proposal.rejectReason && (
                              <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 space-y-1">
                                <div className="font-bold flex items-center gap-1 text-red-400">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Комментарий модератора:</span>
                                </div>
                                <p>{proposal.rejectReason}</p>
                              </div>
                            )}

                            {/* User note */}
                            {proposal.userComment && (
                              <div className="text-[11px] text-neutral-400 bg-white/5 p-2 rounded-lg">
                                <span className="font-semibold text-neutral-300">Ваш комментарий: </span>
                                {proposal.userComment}
                              </div>
                            )}

                            {/* Footer actions for proposal */}
                            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                              {proposal.status === 'pending' ? (
                                <button
                                  onClick={() => handleRevokeProposal(proposal.id, title)}
                                  className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 hover:underline transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Отозвать заявку</span>
                                </button>
                              ) : proposal.status === 'approved' ? (
                                <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Добавлено в общую хронологию сервера</span>
                                </span>
                              ) : (
                                <span className="text-neutral-500 text-[11px]">
                                  Вы можете подать новую отредактированную заявку
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MY EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      События с участием @{currentNick} ({myEvents.length})
                    </h4>
                  </div>

                  {myEvents.length === 0 ? (
                    <div className="py-10 text-center bg-[#151515] border border-white/5 rounded-2xl p-4">
                      <p className="text-xs text-neutral-400">
                        Вы пока не отмечены участником в опубликованных событиях летописи.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {myEvents.map((evt) => {
                        const cat = EVENT_CATEGORIES[evt.type] || EVENT_CATEGORIES.event;
                        const CatIcon = cat.icon;
                        return (
                          <div
                            key={evt.id}
                            className="p-3 rounded-xl bg-[#171717] border border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-2"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="p-1 rounded text-xs"
                                  style={{ backgroundColor: cat.badgeBg, color: cat.badgeText }}
                                >
                                  <CatIcon className="w-3 h-3" />
                                </span>
                                <span className="text-[11px] font-mono text-neutral-400">{evt.date}</span>
                              </div>
                              <h5 className="text-xs font-bold text-white line-clamp-1">{evt.title}</h5>
                              {evt.description && (
                                <p className="text-[11px] text-neutral-400 line-clamp-2">{evt.description}</p>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                onClose();
                                onJumpToEvent(evt.id);
                              }}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-end transition-colors"
                            >
                              <span>Показать на таймлайне</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MY PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Мега-стройки и проекты @{currentNick} ({myProjects.length})
                    </h4>
                  </div>

                  {myProjects.length === 0 ? (
                    <div className="py-10 text-center bg-[#151515] border border-white/5 rounded-2xl p-4">
                      <p className="text-xs text-neutral-400">
                        Вы пока не указаны строителем в каталоге строек. Предложите свою стройку!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {myProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="p-3.5 rounded-xl bg-[#171717] border border-white/10 hover:border-teal-500/40 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-bold text-white">{proj.title}</h5>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {proj.progressPercent}%
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300">{proj.description}</p>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${proj.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: PASSPORT, PROFILE & PASSWORD MANAGEMENT */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  {/* Profile Edit Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4 bg-[#161616] p-4 sm:p-5 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">Паспорт и данные персонажа</h4>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">@{currentNick}</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-400 mb-1 font-semibold">
                            Роль / Титул на сервере:
                          </label>
                          <input
                            type="text"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            placeholder="Например: Архитектор, Фермер, Воин..."
                            className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-400 mb-1 font-semibold">
                            Координаты базы / дома:
                          </label>
                          <input
                            type="text"
                            value={editHomeCoords}
                            onChange={(e) => setEditHomeCoords(e.target.value)}
                            placeholder="Например: X: 450, Y: 68, Z: -320"
                            className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-neutral-400 mb-1 font-semibold">
                            Discord тег:
                          </label>
                          <input
                            type="text"
                            value={editDiscord}
                            onChange={(e) => setEditDiscord(e.target.value)}
                            placeholder="username или user#1234"
                            className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        <div>
                          <label className="block text-neutral-400 mb-1 font-semibold">
                            Telegram:
                          </label>
                          <input
                            type="text"
                            value={editTelegram}
                            onChange={(e) => setEditTelegram(e.target.value)}
                            placeholder="@username"
                            className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1 font-semibold">
                          Описание и биография персонажа:
                        </label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Расскажите о своих базах, целях, стиле игры..."
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1 font-semibold">
                          Фирменный цвет профиля:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={editColor || '#00e676'}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                          />
                          <span className="font-mono text-neutral-300">{editColor || '#00e676'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Сохранить паспорт</span>
                      </button>
                    </div>
                  </form>

                  {/* Password Security Block */}
                  <div className="bg-[#161616] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-white">Безопасность и пароль</h4>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>Защищен паролем</span>
                      </span>
                    </div>

                    {!isChangingPass ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <p className="text-neutral-400 leading-relaxed max-w-md">
                          Ваш личный кабинет защищен паролем. Вы можете сменить пароль в любое время для защиты профиля.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsChangingPass(true);
                            setChangePassError('');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Key className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Сменить пароль</span>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-3 pt-1 animate-in fade-in duration-150 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-neutral-400 font-medium">
                              Текущий пароль
                            </label>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={currentPassInput}
                              onChange={(e) => setCurrentPassInput(e.target.value)}
                              placeholder="Текущий пароль"
                              className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="block text-neutral-400 font-medium">
                                Новый пароль
                              </label>
                              {newPassInput && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                                  style={{
                                    backgroundColor: `${newPassStrength.color}20`,
                                    color: newPassStrength.color,
                                  }}
                                >
                                  {newPassStrength.label}
                                </span>
                              )}
                            </div>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={newPassInput}
                              onChange={(e) => setNewPassInput(e.target.value)}
                              placeholder="Новый пароль"
                              className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                            />
                            {newPassInput && (
                              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                                <div
                                  className="h-full transition-all duration-300 rounded-full"
                                  style={{
                                    width: `${newPassStrength.score}%`,
                                    backgroundColor: newPassStrength.color,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-neutral-400 font-medium">
                              Повтор нового
                            </label>
                            <input
                              type={showNewPass ? 'text' : 'password'}
                              value={confirmNewPassInput}
                              onChange={(e) => setConfirmNewPassInput(e.target.value)}
                              placeholder="Повтор пароля"
                              className="w-full px-3 py-2 rounded-xl bg-[#101010] border border-white/15 text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                        </div>

                        {changePassError && (
                          <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                            <span>{changePassError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px]"
                          >
                            {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span>{showNewPass ? 'Скрыть символы' : 'Показать символы'}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsChangingPass(false);
                                setChangePassError('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                            >
                              Отмена
                            </button>
                            <button
                              type="submit"
                              className="px-3.5 py-1.5 rounded-xl bg-[#00e676] hover:bg-[#00c853] text-black font-bold transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Применить новый пароль</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-[#0e0e0e] border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Авторизован: <strong className="text-white">@{currentNick}</strong></span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
