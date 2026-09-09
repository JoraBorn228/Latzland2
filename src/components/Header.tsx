import React, { useState, useRef, useEffect } from 'react';
import {
  Pickaxe,
  Plus,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Users,
  Compass,
  Flame,
  ChevronDown,
  Globe,
  ExternalLink,
  Trophy,
  Hammer,
  Inbox,
  Send,
  User,
  Search,
  Home,
  X,
  FileText,
} from 'lucide-react';
import { MinecraftServerStatus } from '../types';
import { getMinecraftHeadUrl } from '../utils/playerUtils';

interface HeaderProps {
  onGoToHome?: () => void;
  onGoToRules?: () => void;
  isAdmin: boolean;
  activePlayerNick?: string | null;
  serverStatus?: MinecraftServerStatus;
  pendingProposalsCount?: number;
  myProposalsCount?: number;
  onToggleAdmin: () => void;
  onOpenPlayerCabinet: () => void;
  onOpenAddModal: () => void;
  onOpenPlayersModal: () => void;
  onOpenWorldMap: () => void;
  onOpenNetherCalc: () => void;
  onOpenHallOfFame: () => void;
  onOpenProjectsCatalog: () => void;
  onOpenModerationModal: () => void;
  onShowToast: (msg: string) => void;
  onFocusSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  activePlayerNick,
  serverStatus,
  pendingProposalsCount = 0,
  myProposalsCount = 0,
  onGoToHome,
  onGoToRules,
  onToggleAdmin,
  onOpenPlayerCabinet,
  onOpenAddModal,
  onOpenPlayersModal,
  onOpenWorldMap,
  onOpenNetherCalc,
  onOpenHallOfFame,
  onOpenProjectsCatalog,
  onOpenModerationModal,
  onShowToast,
  onFocusSearch,
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const SERVER_IP = serverStatus?.ip || 'play.latzland.eu';
  const isOnline = serverStatus?.online ?? true;
  const onlineCount = serverStatus?.onlinePlayers ?? 0;
  const maxPlayers = serverStatus?.maxPlayers ?? 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyServerIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(SERVER_IP);
    setCopiedIp(true);
    onShowToast(`IP скопирован: ${SERVER_IP}`);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const closeAndCall = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  const menuItems = [
    {
      group: 'Личное',
      items: [
        {
          icon: User,
          label: 'Личный кабинет',
          sub: activePlayerNick ? `@${activePlayerNick}` : 'Войти',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10',
          border: 'border-cyan-500/25',
          action: onOpenPlayerCabinet,
          badge: myProposalsCount > 0 ? String(myProposalsCount) : undefined,
          badgeColor: 'bg-cyan-400 text-black',
          customIcon: activePlayerNick ? (
            <img
              src={getMinecraftHeadUrl(activePlayerNick, 24)}
              alt={activePlayerNick}
              className="w-6 h-6 rounded"
            />
          ) : undefined,
        },
      ],
    },
    {
      group: 'Разделы',
      items: [
        {
          icon: Hammer,
          label: 'Каталог строек',
          sub: 'Мегапроекты и базы',
          color: 'text-teal-400',
          bg: 'bg-teal-500/8',
          border: 'border-transparent',
          action: onOpenProjectsCatalog,
        },
        {
          icon: Trophy,
          label: 'Зал Славы',
          sub: 'Медали, MVP, рейтинги',
          color: 'text-amber-400',
          bg: 'bg-amber-500/8',
          border: 'border-transparent',
          action: onOpenHallOfFame,
        },
        {
          icon: Users,
          label: 'База игроков',
          sub: 'Профили и статистика',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/8',
          border: 'border-transparent',
          action: onOpenPlayersModal,
        },
        {
          icon: FileText,
          label: 'Правила сервера',
          sub: 'PvP, постройки, читы',
          color: 'text-violet-400',
          bg: 'bg-violet-500/8',
          border: 'border-transparent',
          action: onGoToRules ?? (() => {}),
        },
      ],
    },
    {
      group: 'Инструменты',
      items: [
        {
          icon: Compass,
          label: '2D-Карта мира',
          sub: 'Базы, спавн, порталы',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/8',
          border: 'border-transparent',
          action: onOpenWorldMap,
        },
        {
          icon: Flame,
          label: 'Калькулятор Незера',
          sub: 'Порталы 8:1',
          color: 'text-rose-400',
          bg: 'bg-rose-500/8',
          border: 'border-transparent',
          action: onOpenNetherCalc,
        },
        {
          icon: Globe,
          label: 'BlueMap 3D',
          sub: 'map.latzland.eu',
          color: 'text-blue-400',
          bg: 'bg-blue-500/8',
          border: 'border-transparent',
          action: () => {
            window.open('http://map.latzland.eu:29476/#world:0:70:0:50:1.61:0.78:0:0:perspective', '_blank');
            setIsMenuOpen(false);
          },
          external: true,
        },
      ],
    },
  ];

  return (
    <>
      <style>{`
        @keyframes hdr-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .hdr-logo-text {
          background: linear-gradient(90deg, #ffffff 0%, #00e676 50%, #ffffff 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: hdr-shimmer 6s linear infinite;
        }
        @keyframes menu-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        .menu-popup { animation: menu-in 0.18s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes online-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0,230,118,0); }
          50%       { box-shadow: 0 0 0 4px rgba(0,230,118,0.15); }
        }
        .online-dot { animation: online-pulse 2.5s ease-in-out infinite; }
      `}</style>

      <header
        id="main-top-header"
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'linear-gradient(180deg, rgba(12,12,12,0.97) 0%, rgba(12,12,12,0.92) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 1px 0 rgba(0,230,118,0.04), 0 4px 24px rgba(0,0,0,0.3)',
        }}
      >
        {/* Thin emerald top line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.5) 40%, rgba(0,230,118,0.5) 60%, transparent)' }}
        />

        <div className="max-w-5xl lg:max-w-6xl w-full mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">

          {/* ─── LEFT: Logo + Home ─── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Logo button */}
            <button
              type="button"
              onClick={() => onGoToHome?.()}
              className="group flex items-center gap-2 shrink-0 focus:outline-none"
              title="На главную"
            >
              {/* Server Emblem logo2.png */}
              <div
                className="w-8 h-8 rounded-xl p-0.5 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:rotate-[-4deg] bg-gradient-to-br from-[#00e676]/30 via-[#0a1810] to-[#00d2ff]/20 border border-emerald-500/50 shadow-[0_0_14px_rgba(0,230,118,0.4)]"
              >
                <img
                  src="/logo2.png"
                  alt="LatzLand Logo"
                  className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Brand name */}
              <span className="hdr-logo-text font-black text-base sm:text-lg tracking-tight hidden xs:block">
                LatzLand
              </span>
            </button>

            {/* Admin badge (inline, not as separate button) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onToggleAdmin}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#fbbf24',
                  boxShadow: '0 0 12px rgba(245,158,11,0.15)',
                }}
                title="Нажмите, чтобы выйти из режима администратора"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Админ</span>
              </button>
            )}

            {/* Separator + Home pill (on wider screens) */}
            <div className="hidden lg:flex items-center gap-1.5">
              <div className="w-px h-4 bg-white/10" />
              <button
                type="button"
                onClick={() => onGoToHome?.()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-white/8 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Главная</span>
              </button>
            </div>
          </div>

          {/* ─── CENTER: Server status chip ─── */}
          <button
            type="button"
            onClick={copyServerIp}
            title="Нажмите, чтобы скопировать IP"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 shrink-0 group"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,230,118,0.35)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,230,118,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.09)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            {/* Status dot */}
            <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
              {isOnline ? (
                <>
                  <span className="animate-ping absolute w-full h-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-400 online-dot" />
                </>
              ) : (
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
              )}
            </span>

            <span className="font-mono text-[12px] font-semibold text-neutral-200 group-hover:text-white transition-colors">
              {SERVER_IP}
            </span>

            {isOnline && (
              <>
                <span className="w-px h-3 bg-white/15" />
                <span className="text-[11px] font-semibold text-emerald-400">
                  {onlineCount}{maxPlayers > 0 ? `/${maxPlayers}` : ''} онлайн
                </span>
              </>
            )}
            {!isOnline && <span className="text-[11px] text-neutral-600">офлайн</span>}

            {copiedIp ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
            )}
          </button>

          {/* ─── RIGHT: Actions ─── */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Search shortcut */}
            {onFocusSearch && (
              <button
                type="button"
                onClick={onFocusSearch}
                title="Поиск (клавиша /)"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <Search className="w-3.5 h-3.5" />
                <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-white/10 text-neutral-500">/</kbd>
              </button>
            )}

            {/* Moderation queue (admin only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenModerationModal}
                title="Очередь заявок на модерацию"
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  color: '#fbbf24',
                  boxShadow: '0 0 14px rgba(245,158,11,0.15)',
                }}
              >
                <Inbox className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Предложка</span>
                {pendingProposalsCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center px-1"
                  >
                    {pendingProposalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Add / Propose event */}
            <button
              type="button"
              onClick={onOpenAddModal}
              title={isAdmin ? 'Опубликовать событие' : 'Предложить событие'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shrink-0"
              style={isAdmin ? {
                background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)',
                color: '#000',
                boxShadow: '0 0 16px rgba(0,230,118,0.3)',
              } : {
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
                boxShadow: '0 0 12px rgba(16,185,129,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {isAdmin ? <Plus className="w-4 h-4 stroke-[2.8]" /> : <Send className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isAdmin ? 'Добавить' : 'Предложить'}</span>
            </button>

            {/* ─── Menu toggle ─── */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                id="header-menu-btn"
                onClick={() => setIsMenuOpen((v) => !v)}
                title="Меню разделов"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={isMenuOpen ? {
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d4d4d4',
                }}
              >
                <span className="hidden sm:inline text-xs">Меню</span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform duration-200"
                  style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* ─── Dropdown ─── */}
              {isMenuOpen && (
                <div
                  className="menu-popup absolute -right-16 sm:right-0 mt-2.5 w-72 sm:w-80 max-w-[calc(100vw-1rem)] z-50 overflow-hidden max-h-[80vh] overflow-y-auto"
                  style={{
                    background: 'linear-gradient(180deg, #131313 0%, #111111 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                  }}
                >
                  {/* Menu header */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #00e676 0%, #00c853 100%)' }}
                      >
                        <Pickaxe className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                      </div>
                      <span className="text-xs font-bold text-white">LatzLand Hub</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Menu groups */}
                  <div className="p-2 space-y-1">
                    {menuItems.map((group) => (
                      <div key={group.group}>
                        <div className="px-2 py-1 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                          {group.group}
                        </div>
                        {group.items.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => closeAndCall(item.action)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group/item"
                            style={{ background: 'transparent' }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            }}
                          >
                            {/* Icon */}
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover/item:scale-110"
                              style={{
                                background: item.bg.replace('bg-', '').replace('/8', '').replace('/10', ''),
                              }}
                            >
                              {item.customIcon ?? (
                                <item.icon className={`w-4 h-4 ${item.color}`} />
                              )}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-neutral-200 group-hover/item:text-white transition-colors truncate">
                                  {item.label}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {item.badge && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                                      {item.badge}
                                    </span>
                                  )}
                                  {(item as any).external && (
                                    <ExternalLink className="w-3 h-3 text-neutral-600" />
                                  )}
                                </div>
                              </div>
                              {item.sub && (
                                <p className="text-[11px] text-neutral-500 truncate mt-0.5">{item.sub}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Admin section */}
                  <div
                    className="p-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => closeAndCall(onOpenModerationModal)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left mb-1 transition-all"
                        style={{
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.2)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(245,158,11,0.08)';
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Inbox className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-amber-200">Предложка заявок</span>
                            {pendingProposalsCount > 0 && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-black">
                                {pendingProposalsCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-amber-400/60 mt-0.5">Проверка событий и строек</p>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => closeAndCall(onToggleAdmin)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all"
                      style={{
                        background: isAdmin ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isAdmin ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = isAdmin
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(255,255,255,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = isAdmin
                          ? 'rgba(245,158,11,0.06)'
                          : 'rgba(255,255,255,0.04)';
                      }}
                    >
                      {isAdmin ? (
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                      <span className={`text-xs font-semibold ${isAdmin ? 'text-amber-300' : 'text-neutral-400'}`}>
                        {isAdmin ? 'Режим администратора (ВКЛ) — Выйти' : 'Войти как администратор'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Player cabinet button (Rightmost position) */}
            <button
              type="button"
              id="header-cabinet-btn"
              onClick={onOpenPlayerCabinet}
              title={activePlayerNick ? `Личный кабинет (@${activePlayerNick})` : 'Войти в личный кабинет'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 active:scale-95"
              style={activePlayerNick ? {
                background: 'rgba(6,182,212,0.15)',
                border: '1px solid rgba(6,182,212,0.4)',
                color: '#67e8f9',
                boxShadow: '0 0 14px rgba(6,182,212,0.2)',
              } : {
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#e5e5e5',
              }}
            >
              {activePlayerNick ? (
                <img
                  src={getMinecraftHeadUrl(activePlayerNick, 20)}
                  alt={activePlayerNick}
                  className="w-4 h-4 rounded border border-cyan-400/40 shrink-0"
                />
              ) : (
                <User className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              )}
              <span className="truncate max-w-[70px] sm:max-w-[100px] font-medium">
                {activePlayerNick ?? 'Кабинет'}
              </span>
              {myProposalsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
