import React, { useState, useRef, useEffect } from 'react';
import {
  Pickaxe,
  Plus,
  Copy,
  Check,
  Server,
  ShieldCheck,
  ShieldAlert,
  Users,
  Compass,
  Flame,
  ChevronDown,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  Trophy,
  Hammer,
  Inbox,
  Send,
  User,
  Search,
  Sparkles,
} from 'lucide-react';
import { MinecraftServerStatus } from '../types';
import { getMinecraftHeadUrl } from '../utils/playerUtils';

interface HeaderProps {
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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const SERVER_IP = serverStatus?.ip || 'play.latzland.eu';
  const isOnline = serverStatus?.online ?? true;
  const onlineCount = serverStatus?.onlinePlayers ?? 0;
  const maxPlayers = serverStatus?.maxPlayers ?? 0;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen]);

  // Close dropdown on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsToolsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const copyServerIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(SERVER_IP);
    setCopiedIp(true);
    onShowToast(`IP сервера скопирован: ${SERVER_IP}`);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const handleToolClick = (action: () => void) => {
    setIsToolsOpen(false);
    action();
  };

  return (
    <header
      id="main-top-header"
      className="sticky top-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-xl border-b border-white/10 transition-all shadow-md"
    >
      <div className="max-w-5xl w-full mx-auto px-2.5 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Left: Brand & Admin Indicator & Nav Pills */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
          {/* Logo Brand */}
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
            className="flex items-center gap-2 cursor-pointer select-none group shrink-0"
            title="LatzLand SMP — Наверх"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00e676] to-emerald-600 flex items-center justify-center text-black shadow-[0_0_16px_rgba(0,230,118,0.35)] shrink-0 group-hover:scale-105 transition-transform">
              <Pickaxe className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-white group-hover:text-[#00e676] transition-colors">
                LatzLand
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
                SMP
              </span>

              {/* Admin status pill if admin is active */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAdmin();
                  }}
                  className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 hover:bg-amber-500/25 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                  title="Режим администратора активен. Нажмите для выхода."
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span className="hidden xs:inline">Админ</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Top Quick Nav Pills (shown on wider screens) */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenProjectsCatalog}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-teal-300 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
              title="Каталог крупных строек и баз"
            >
              <Hammer className="w-3.5 h-3.5 text-teal-400" />
              <span>Стройки</span>
            </button>

            <button
              type="button"
              onClick={onOpenWorldMap}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
              title="Интерактивная 2D-карта мира"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Карта</span>
            </button>

            <button
              type="button"
              onClick={onOpenHallOfFame}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-yellow-300 hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20 transition-all"
              title="Зал Славы и медали игроков"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Зал славы</span>
            </button>
          </nav>
        </div>

        {/* Center: Server IP & Live Ping Chip (Compact, shown on 2xl or lg when not crowded) */}
        <button
          type="button"
          onClick={copyServerIp}
          title="Нажмите, чтобы скопировать IP сервера"
          className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/10 hover:border-[#00e676]/40 text-xs text-neutral-300 transition-all group shadow-sm shrink-0"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            {isOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            )}
          </span>
          <span className="font-mono text-[11px] font-semibold text-neutral-200 group-hover:text-white transition-colors">
            {SERVER_IP}
          </span>
          <span className="text-neutral-600 text-[10px]">•</span>
          <span className="text-[11px] font-medium text-[#00e676] group-hover:underline">
            {isOnline ? `${onlineCount}${maxPlayers > 0 ? `/${maxPlayers}` : ''} онлайн` : 'Офлайн'}
          </span>
          {copiedIp ? (
            <Check className="w-3 h-3 text-[#00e676]" />
          ) : (
            <Copy className="w-3 h-3 text-neutral-500 group-hover:text-white transition-colors" />
          )}
        </button>

        {/* Right: Actions & Player Cabinet (Furthest Right) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          {/* Quick Search trigger button if provided */}
          {onFocusSearch && (
            <button
              type="button"
              onClick={onFocusSearch}
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all shrink-0"
              title="Фокус на строке поиска (Горячая клавиша /)"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-400">/</span>
            </button>
          )}

          {/* Admin Moderation Queue Button (if Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenModerationModal}
              className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0"
              title="Открыть предложку и модерацию заявок от игроков"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Предложка</span>
              {pendingProposalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-black leading-tight">
                  {pendingProposalsCount}
                </span>
              )}
            </button>
          )}

          {/* Primary Action Button: Add / Propose Event */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 shadow-sm shrink-0 ${
              isAdmin
                ? 'bg-[#00e676] hover:bg-[#00c853] text-black shadow-[0_0_14px_rgba(0,230,118,0.3)]'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_12px_rgba(16,185,129,0.25)]'
            }`}
            title={isAdmin ? 'Опубликовать событие напрямую' : 'Предложить событие в предложку'}
          >
            {isAdmin ? <Plus className="w-4 h-4 stroke-[2.8]" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isAdmin ? 'Добавить' : 'Предложить'}
            </span>
          </button>

          {/* Tools & Navigation Dropdown Menu */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsToolsOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isToolsOpen
                  ? 'bg-white/15 text-white border-white/30 shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10 hover:border-white/20'
              }`}
              title="Меню всех разделов и инструментов"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span className="hidden sm:inline">Разделы</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  isToolsOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-[#121212] border border-white/15 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-neutral-200 max-h-[85vh] overflow-y-auto">
                {/* Header in Menu */}
                <div className="px-3.5 py-2 border-b border-white/10 flex items-center justify-between text-xs text-neutral-400">
                  <span className="font-bold uppercase tracking-wider text-[10px]">
                    Разделы и Инструменты
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">LatzLand Hub</span>
                </div>

                <div className="p-1.5 space-y-1">
                  {/* Player Cabinet in menu */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenPlayerCabinet)}
                    className="w-full text-left p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                      {activePlayerNick ? (
                        <img
                          src={getMinecraftHeadUrl(activePlayerNick, 24)}
                          alt={activePlayerNick}
                          className="w-6 h-6 rounded image-render-pixelated"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-cyan-200 group-hover:text-cyan-100 transition-colors flex items-center justify-between">
                        <span>👤 Личный кабинет</span>
                        {activePlayerNick ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold">
                            @{activePlayerNick}
                          </span>
                        ) : (
                          <span className="text-[10px] text-cyan-400 font-mono">Войти</span>
                        )}
                      </div>
                      <p className="text-[11px] text-cyan-300/70 truncate">
                        Статус поданных заявок, участие и профиль
                      </p>
                    </div>
                  </button>

                  {/* Moderation Queue Item if Admin */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToolClick(onOpenModerationModal)}
                      className="w-full text-left p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Inbox className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-amber-200 group-hover:text-amber-100 transition-colors flex items-center justify-between">
                          <span>📬 Предложка заявок</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-mono font-black">
                            {pendingProposalsCount}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-300/70 truncate">
                          Проверка предложенных событий и строек
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Mega Projects Catalog */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenProjectsCatalog)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Hammer className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors flex items-center justify-between">
                        <span>🏗️ Каталог Мега-Строек</span>
                        <span className="text-[10px] text-teal-400 font-mono">Проекты</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Спавн, хабы, фермы и прогресс готовности
                      </p>
                    </div>
                  </button>

                  {/* Hall of Fame */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenHallOfFame)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-yellow-300 transition-colors flex items-center justify-between">
                        <span>🏆 Зал Славы и Награды</span>
                        <span className="text-[10px] text-yellow-400 font-mono">MVP</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Медали, ветераны и рейтинг активности
                      </p>
                    </div>
                  </button>

                  {/* Coordinate 2D World Map */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenWorldMap)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                        <span>🗺️ 2D-Карта координат</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Радар</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Сетка мира, базы, спавн и измерения
                      </p>
                    </div>
                  </button>

                  {/* Nether Calculator */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenNetherCalc)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors flex items-center justify-between">
                        <span>🔥 Калькулятор Незера (8:1)</span>
                        <span className="text-[10px] text-rose-400 font-mono">Порталы</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Связка порталов, тоннели и поиск по F3
                      </p>
                    </div>
                  </button>

                  {/* Players Database */}
                  <button
                    type="button"
                    onClick={() => handleToolClick(onOpenPlayersModal)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                        <span>👥 База игроков сервера</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Паспорта</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        Скины, роли, базы и статистика
                      </p>
                    </div>
                  </button>

                  {/* Direct BlueMap Link */}
                  <a
                    href="http://map.latzland.eu:29476/#world:0:70:0:50:1.61:0.78:0:0:perspective"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsToolsOpen(false)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center justify-between">
                        <span>🌐 Веб-карта BlueMap</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        map.latzland.eu (3D онлайн-мир)
                      </p>
                    </div>
                  </a>
                </div>

                {/* Footer in Menu: Admin Toggle */}
                <div className="p-2 border-t border-white/10 bg-[#0e0e0e]">
                  <button
                    type="button"
                    onClick={() => handleToolClick(onToggleAdmin)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      isAdmin
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isAdmin ? (
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-neutral-400" />
                      )}
                      <span>{isAdmin ? 'Режим администратора (ВКЛ)' : 'Войти как администратор'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {isAdmin ? 'Выйти' : 'Вход'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🌟 Player Cabinet Button (Placed at the FURTHEST RIGHT as requested) 🌟 */}
          <button
            type="button"
            onClick={onOpenPlayerCabinet}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              activePlayerNick
                ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/25 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10 hover:border-white/20'
            }`}
            title="Личный кабинет игрока (статус заявок, участие в событиях, профиль)"
          >
            {activePlayerNick ? (
              <img
                src={getMinecraftHeadUrl(activePlayerNick, 20)}
                alt={activePlayerNick}
                className="w-4 h-4 rounded image-render-pixelated shrink-0 border border-cyan-400/40"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <span className="truncate max-w-[60px] xs:max-w-[75px] sm:max-w-[85px] md:max-w-[100px]">
              {activePlayerNick ? activePlayerNick : 'Кабинет'}
            </span>
            {myProposalsCount > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0"
                title="У вас есть активные заявки"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
