import React, { useState, useMemo } from 'react';
import {
  Trophy,
  X,
  Crown,
  Award,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  Star,
  Users,
  Compass,
  Check,
  Medal,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { LatzEvent, PlayerProfile } from '../types';
import { resolvePlayerBadges, ResolvedBadge } from '../utils/badgeUtils';
import { BadgeEditorModal } from './BadgeEditorModal';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerProfile[];
  events: LatzEvent[];
  isAdmin?: boolean;
  onUpdatePlayerProfile?: (updated: PlayerProfile) => void;
  onOpenPlayerProfile: (username: string) => void;
  onFilterByPlayer: (username: string) => void;
  onShowToast: (msg: string) => void;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
  players,
  events,
  isAdmin,
  onUpdatePlayerProfile,
  onOpenPlayerProfile,
  onFilterByPlayer,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'founders' | 'builders' | 'warriors' | 'active'>('all');
  const [activeTab, setActiveTab] = useState<'cards' | 'leaderboard'>('cards');
  const [badgeEditorPlayer, setBadgeEditorPlayer] = useState<PlayerProfile | null>(null);

  // Compute stats and resolved badges for each player
  const enrichedPlayers = useMemo(() => {
    return players.map((player) => {
      const playerEvents = events.filter(
        (e) =>
          e.players &&
          e.players.some((p) => p.toLowerCase() === player.username.toLowerCase())
      );

      const resolvedBadges = resolvePlayerBadges(player, events);

      const isFounder =
        player.username.toLowerCase() === 'weistel' ||
        player.username.toLowerCase() === 'fr0gus' ||
        Boolean(player.role?.toLowerCase().includes('основатель')) ||
        resolvedBadges.some((b) => b.id === 'founder');

      return {
        ...player,
        eventsCount: playerEvents.length,
        playerEvents,
        unlockedAchievements: resolvedBadges,
        isFounder,
      };
    });
  }, [players, events]);

  // Filter players
  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedPlayers.filter((p) => {
      const matchesSearch =
        p.username.toLowerCase().includes(q) ||
        (p.role && p.role.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory === 'founders') {
        return p.isFounder;
      }
      if (selectedCategory === 'builders') {
        return (
          p.role?.toLowerCase().includes('строит') ||
          p.role?.toLowerCase().includes('архитект') ||
          p.unlockedAchievements.some((a) => a.id === 'architect')
        );
      }
      if (selectedCategory === 'warriors') {
        return (
          p.role?.toLowerCase().includes('воин') ||
          p.role?.toLowerCase().includes('боец') ||
          p.unlockedAchievements.some((a) => a.id === 'warrior')
        );
      }
      if (selectedCategory === 'active') {
        return p.eventsCount > 0;
      }

      return true;
    });
  }, [enrichedPlayers, searchQuery, selectedCategory]);

  // Leaderboard ranking by events count
  const leaderboard = useMemo(() => {
    return [...enrichedPlayers].sort((a, b) => {
      if (b.eventsCount !== a.eventsCount) {
        return b.eventsCount - a.eventsCount;
      }
      return b.unlockedAchievements.length - a.unlockedAchievements.length;
    });
  }, [enrichedPlayers]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#121212] border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-b from-[#1c1810] to-[#121212] border-b border-amber-500/20 px-4 sm:px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.45)]">
                  <Trophy className="w-5 h-5 stroke-[2.3]" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight flex items-center gap-2">
                    <span>Зал Славы и Достижений</span>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Выдающиеся игроки, основатели, ветераны и знаки отличия LatzLand
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats & Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-lg sm:text-xl font-black text-amber-300">
                  {players.length}
                </div>
                <div className="text-[10px] sm:text-xs text-amber-200/70 uppercase tracking-wider font-semibold">
                  Игроков в зале
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-lg sm:text-xl font-black text-emerald-300">
                  {enrichedPlayers.filter((p) => p.isFounder).length}
                </div>
                <div className="text-[10px] sm:text-xs text-emerald-200/70 uppercase tracking-wider font-semibold">
                  Основателей
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-lg sm:text-xl font-black text-purple-300">
                  {events.length}
                </div>
                <div className="text-[10px] sm:text-xs text-purple-200/70 uppercase tracking-wider font-semibold">
                  Хроник & Битв
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <div className="text-lg sm:text-xl font-black text-cyan-300">
                  {enrichedPlayers.reduce((acc, p) => acc + p.unlockedAchievements.length, 0)}
                </div>
                <div className="text-[10px] sm:text-xs text-cyan-200/70 uppercase tracking-wider font-semibold">
                  Выдано знаков
                </div>
              </div>
            </div>

            {/* Sub Nav & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
              {/* Tabs Switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'cards'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Карточки славы</span>
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'leaderboard'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Medal className="w-3.5 h-3.5" />
                  <span>Рейтинг влияния</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по нику или роли..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Category Filter Chips */}
            {activeTab === 'cards' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  Все игроки ({enrichedPlayers.length})
                </button>
                <button
                  onClick={() => setSelectedCategory('founders')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'founders'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  👑 Основатели
                </button>
                <button
                  onClick={() => setSelectedCategory('builders')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'builders'
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  🏛️ Архитекторы
                </button>
                <button
                  onClick={() => setSelectedCategory('warriors')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'warriors'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  ⚔️ Ветераны войн
                </button>
                <button
                  onClick={() => setSelectedCategory('active')}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === 'active'
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10'
                  }`}
                >
                  🔥 В хрониках
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            
            {/* TAB 1: PLAYER HERO CARDS */}
            {activeTab === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`p-4 sm:p-5 rounded-2xl bg-[#171717] border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                      player.isFounder
                        ? 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                        : 'border-white/10 hover:border-amber-500/30'
                    }`}
                  >
                    {/* Top card info with skin avatar */}
                    <div className="flex items-start gap-3.5">
                      {/* Skin Avatar with frame */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 overflow-hidden flex items-center justify-center p-1 group-hover:border-amber-500/40 transition-colors">
                          <img
                            src={`https://minotar.net/bust/${player.username}/100`}
                            alt={player.username}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = `https://minotar.net/helm/${player.username}/64`;
                            }}
                          />
                        </div>
                        {player.isFounder && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-md">
                            <Crown className="w-3.5 h-3.5 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      {/* Name and Role */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-base font-extrabold text-white truncate">
                              {player.username}
                            </h3>
                            {player.role && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                                {player.role}
                              </span>
                            )}
                          </div>

                          {isAdmin && onUpdatePlayerProfile && (
                            <button
                              type="button"
                              onClick={() => setBadgeEditorPlayer(player)}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Править знаки отличия игрока"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Знаки</span>
                            </button>
                          )}
                        </div>

                        {player.description && (
                          <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                            {player.description}
                          </p>
                        )}

                        {/* Quick counts */}
                        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400 mt-2">
                          <span>Событий: <strong className="text-amber-400">{player.eventsCount}</strong></span>
                          <span>•</span>
                          <span>Знаков: <strong className="text-emerald-400">{player.unlockedAchievements.length}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Achievements Badges list */}
                    {player.unlockedAchievements.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Знаки отличия & Награды:
                          </div>
                          {isAdmin && (
                            <span className="text-[9px] text-amber-400/80 font-mono">
                              Режим редактора
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {player.unlockedAchievements.map((ach) => (
                            <span
                              key={ach.id}
                              title={ach.description}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ach.bg} ${ach.border} ${ach.color}`}
                            >
                              <span className="text-xs">{ach.iconEmoji}</span>
                              <span>{ach.title}</span>
                              {ach.isCustom && (
                                <span className="text-[9px] opacity-75">★</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPlayerProfile(player.username);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all text-center"
                      >
                        Паспорт игрока
                      </button>
                      {player.eventsCount > 0 && (
                        <button
                          onClick={() => {
                            onClose();
                            onFilterByPlayer(player.username);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-all"
                          title="Показать события игрока в хронологии"
                        >
                          События ({player.eventsCount})
                        </button>
                      )}
                      {isAdmin && onUpdatePlayerProfile && (
                        <button
                          onClick={() => setBadgeEditorPlayer(player)}
                          className="py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all"
                          title="Редактировать знаки отличия"
                        >
                          🎖️
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: LEADERBOARD RANKING */}
            {activeTab === 'leaderboard' && (
              <div className="p-4 rounded-2xl bg-[#161616] border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Топ игроков по историческому влиянию
                  </span>
                  <span className="text-xs text-neutral-500">События и титулы</span>
                </div>

                <div className="divide-y divide-white/5">
                  {leaderboard.map((p, idx) => {
                    const rankColor =
                      idx === 0
                        ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/40'
                        : idx === 1
                        ? 'text-slate-300 bg-slate-300/20 border-slate-300/40'
                        : idx === 2
                        ? 'text-amber-600 bg-amber-600/20 border-amber-600/40'
                        : 'text-neutral-500 bg-white/5 border-white/10';

                    return (
                      <div
                        key={p.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-white/5 px-2 rounded-xl transition-colors"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => {
                            onClose();
                            onOpenPlayerProfile(p.username);
                          }}
                        >
                          {/* Rank Badge */}
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${rankColor}`}
                          >
                            #{idx + 1}
                          </div>

                          {/* Avatar */}
                          <img
                            src={`https://minotar.net/helm/${p.username}/32`}
                            alt={p.username}
                            className="w-8 h-8 rounded-lg"
                          />

                          {/* Name & Role */}
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{p.username}</span>
                              {p.isFounder && (
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-400">{p.role || 'Житель'}</div>
                          </div>
                        </div>

                        {/* Score metrics & actions */}
                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-xs font-mono font-bold text-amber-400">
                              {p.eventsCount}
                            </div>
                            <div className="text-[9px] text-neutral-500 uppercase">Событий</div>
                          </div>

                          <div>
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {p.unlockedAchievements.length}
                            </div>
                            <div className="text-[9px] text-neutral-500 uppercase">Знаков</div>
                          </div>

                          {isAdmin && onUpdatePlayerProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBadgeEditorPlayer(p);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                            >
                              🎖️ Править
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onOpenPlayerProfile(p.username);
                            }}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors"
                          >
                            Паспорт
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 bg-[#0e0e0e] border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span>Всего игроков в Зале Славы: <strong>{players.length}</strong></span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      {/* Badge Editor Modal for Admin */}
      {badgeEditorPlayer && (
        <BadgeEditorModal
          isOpen={Boolean(badgeEditorPlayer)}
          onClose={() => setBadgeEditorPlayer(null)}
          player={badgeEditorPlayer}
          events={events}
          onSavePlayer={(updated) => {
            onUpdatePlayerProfile?.(updated);
            setBadgeEditorPlayer(null);
          }}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
};
