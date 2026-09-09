import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Filter,
  Download,
  Shield,
  Layers,
  ChevronRight,
  Wifi,
  Edit3,
  Clock,
  UserCheck,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { LatzEvent, PlayerProfile, MinecraftServerStatus, EVENT_CATEGORIES } from '../types';
import {
  getMinecraftBodyUrl,
  getMinecraftHeadUrl,
  getMinecraftSkinDownloadUrl,
  getPlayerColor,
  formatLastSeen,
} from '../utils/playerUtils';
import { formatRussianDate } from '../utils/dateUtils';
import { resolvePlayerBadges, ResolvedBadge } from '../utils/badgeUtils';
import { BadgeEditorModal } from './BadgeEditorModal';

interface PlayerProfileModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  events: LatzEvent[];
  playersDatabase: PlayerProfile[];
  serverStatus?: MinecraftServerStatus;
  isAdmin?: boolean;
  onUpdatePlayerProfile?: (updated: PlayerProfile) => void;
  onFilterByPlayer: (username: string) => void;
  onJumpToEvent: (eventId: string) => void;
  onShowToast: (msg: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  username,
  isOpen,
  onClose,
  events,
  playersDatabase,
  serverStatus,
  isAdmin,
  onUpdatePlayerProfile,
  onFilterByPlayer,
  onJumpToEvent,
  onShowToast,
}) => {
  const [copiedNick, setCopiedNick] = useState(false);
  const [copiedCoordId, setCopiedCoordId] = useState<string | null>(null);
  const [isBadgeEditorOpen, setIsBadgeEditorOpen] = useState(false);

  if (!isOpen || !username) return null;

  // Check if player profile exists in database
  const profile = playersDatabase.find(
    (p) => p.username.toLowerCase() === username.toLowerCase()
  );

  const effectiveProfile: PlayerProfile = profile || {
    id: `temp-${username}`,
    username,
    role: 'Житель',
    color: getPlayerColor(username),
  };

  // Check if player is currently online on play.latzland.eu
  const isOnline = Boolean(
    serverStatus?.online &&
      serverStatus?.playerList?.some(
        (name) => name.toLowerCase() === username.toLowerCase()
      )
  );

  // Find all events mentioning this player
  const playerEvents = events.filter((e) =>
    e.players?.some((p) => p.toLowerCase() === username.toLowerCase())
  );

  // Collect all unique coordinates associated with this player's events
  const playerCoordinates = playerEvents
    .filter((e) => Boolean(e.coordinates))
    .map((e) => ({
      eventId: e.id,
      eventTitle: e.title,
      date: e.date,
      coordinates: e.coordinates!,
    }));

  // Unique seasons
  const seasons = Array.from(
    new Set(playerEvents.map((e) => e.season).filter(Boolean) as number[])
  ).sort((a, b) => a - b);

  const playerColor = profile?.color || getPlayerColor(username);

  const copyNick = () => {
    navigator.clipboard.writeText(username);
    setCopiedNick(true);
    onShowToast(`Никнейм ${username} скопирован!`);
    setTimeout(() => setCopiedNick(false), 2000);
  };

  const formatCoordsString = (c?: string | { x: number; y?: number; z: number }): string => {
    if (!c) return '';
    if (typeof c === 'string') return c;
    return c.y !== undefined ? `X: ${c.x}, Y: ${c.y}, Z: ${c.z}` : `X: ${c.x}, Z: ${c.z}`;
  };

  const copyCoords = (coords: { x: number; y?: number; z: number; dimension?: string }, id: string) => {
    const text = coords.y !== undefined ? `${coords.x} ${coords.y} ${coords.z}` : `${coords.x} ${coords.z}`;
    navigator.clipboard.writeText(text);
    setCopiedCoordId(id);
    onShowToast(`Координаты скопированы: X: ${coords.x}, Z: ${coords.z}`);
    setTimeout(() => setCopiedCoordId(null), 2000);
  };

  // Calculate all dynamic and assigned achievements & badges using resolvePlayerBadges
  const resolvedBadges = resolvePlayerBadges(effectiveProfile, events);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#111111] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner with color accent */}
        <div
          className="h-28 sm:h-32 w-full relative overflow-hidden flex items-end p-4 sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${playerColor}22 0%, #111111 100%)`,
            borderBottom: `1px solid ${playerColor}33`,
          }}
        >
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-neutral-400 hover:text-white border border-white/10 transition-colors z-10"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Online badge top-left */}
          <div className="absolute top-3 left-4 flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] text-xs font-semibold shadow-[0_0_12px_rgba(0,230,118,0.25)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00e676]"></span>
                </span>
                В сети на сервере
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500"></span>
                Офлайн
              </span>
            )}
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="px-5 sm:px-6 pb-4 pt-0 -mt-12 sm:-mt-14 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10">
          <div className="flex items-end gap-3.5 sm:gap-4">
            {/* Skin head/body preview */}
            <div className="relative group shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1a1a1a] border-2 flex items-center justify-center overflow-hidden shadow-xl"
                style={{ borderColor: playerColor }}
              >
                <img
                  src={getMinecraftHeadUrl(username, 96)}
                  alt={username}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://mc-heads.net/avatar/MHF_Steve/96';
                  }}
                />
              </div>
            </div>

            {/* Name and role */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {username}
                </h2>
                <button
                  onClick={copyNick}
                  className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  title="Скопировать никнейм"
                >
                  {copiedNick ? (
                    <Check className="w-3.5 h-3.5 text-[#00e676]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {profile?.role ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-semibold border"
                    style={{
                      backgroundColor: `${playerColor}15`,
                      color: playerColor,
                      borderColor: `${playerColor}40`,
                    }}
                  >
                    {profile.role}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-white/5 border border-white/10 text-neutral-300">
                    Житель LatzLand
                  </span>
                )}

                {seasons.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
                    {seasons.length === 1 ? `Сезон ${seasons[0]}` : `Сезоны: ${seasons.join(', ')}`}
                  </span>
                )}

                {/* Registration Source Indicator */}
                {profile?.isAutoRegistered ? (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-semibold"
                    title="Записан автоматически: игрок обнаружен на сервере в онлайне"
                  >
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span>Авто-запись сервера</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-semibold"
                    title="Официально зарегистрированный профиль игрока"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Зарегистрирован</span>
                  </span>
                )}

                {isAdmin && profile && onUpdatePlayerProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !profile.isAutoRegistered;
                      onUpdatePlayerProfile({
                        ...profile,
                        isAutoRegistered: next,
                      });
                      onShowToast(
                        next
                          ? `Игрок ${profile.username} переведен в авто-запись`
                          : `Регистрация игрока ${profile.username} подтверждена!`
                      );
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors"
                    title="Сменить статус регистрации игрока"
                  >
                    {profile.isAutoRegistered ? 'Сделать зарегистрированным' : 'Сделать авто-записью'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions: filter timeline */}
          <div className="flex items-center gap-2 pb-1 sm:self-end">
            <button
              onClick={() => {
                onFilterByPlayer(username);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00e676] hover:bg-[#00c853] text-black shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>События игрока ({playerEvents.length})</span>
            </button>

            <a
              href={getMinecraftSkinDownloadUrl(username)}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Скачать скин игрока"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Bio / Description & Contacts */}
          <div className="space-y-3">
            {profile?.description && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                  Об игроке
                </span>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {profile.description}
                </p>
              </div>
            )}

            {/* Passport info cards */}
            {(profile?.discord || profile?.telegram || profile?.homeCoordinates || profile?.registeredAt) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {profile.homeCoordinates && (
                  <div
                    onClick={() => {
                      const str = formatCoordsString(profile.homeCoordinates);
                      navigator.clipboard.writeText(str);
                      onShowToast(`Координаты дома скопированы: ${str}`);
                    }}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-neutral-300 flex items-center justify-between gap-2 cursor-pointer hover:bg-red-500/15 transition-colors"
                    title="Нажмите, чтобы скопировать координаты"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="truncate font-mono">База: {formatCoordsString(profile.homeCoordinates)}</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                )}

                {profile.discord && (
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(profile.discord!);
                      onShowToast(`Discord скопирован: ${profile.discord}`);
                    }}
                    className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-neutral-300 flex items-center justify-between gap-2 cursor-pointer hover:bg-indigo-500/15 transition-colors"
                    title="Нажмите, чтобы скопировать Discord"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-indigo-400 font-bold">DS:</span>
                      <span className="truncate">{profile.discord}</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                )}

                {profile.telegram && (
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(profile.telegram!);
                      onShowToast(`Telegram скопирован: ${profile.telegram}`);
                    }}
                    className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-neutral-300 flex items-center justify-between gap-2 cursor-pointer hover:bg-cyan-500/15 transition-colors"
                    title="Нажмите, чтобы скопировать Telegram"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-cyan-400 font-bold">TG:</span>
                      <span className="truncate">{profile.telegram}</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                )}

                {profile.registeredAt && (
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">В реестре с: {profile.registeredAt}</span>
                  </div>
                )}

                {profile.lastSeen && (
                  <div
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-2"
                    title={`Точное время активности: ${profile.lastSeen}`}
                  >
                    <UserCheck className="w-4 h-4 text-[#00e676] shrink-0" />
                    <span className="truncate">{formatLastSeen(profile.lastSeen)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Player stats row */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#161616] border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-neutral-400 block mb-0.5">
                Событий
              </span>
              <span className="text-xl sm:text-2xl font-black text-white">
                {playerEvents.length}
              </span>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-neutral-400 block mb-0.5">
                Локаций
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400">
                {playerCoordinates.length}
              </span>
            </div>
            <div className="bg-[#161616] border border-white/10 rounded-xl p-3 text-center">
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-neutral-400 block mb-0.5">
                Сезонов
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {seasons.length || 1}
              </span>
            </div>
          </div>

          {/* Badges and Milestones */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Знаки отличия & Награды ({resolvedBadges.length})
                </h3>
              </div>

              {isAdmin && onUpdatePlayerProfile && (
                <button
                  type="button"
                  onClick={() => setIsBadgeEditorOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Править знаки</span>
                </button>
              )}
            </div>

            {resolvedBadges.length === 0 ? (
              <div className="p-3 text-center text-xs text-neutral-500 border border-dashed border-white/10 rounded-xl">
                У игрока пока нет открытых знаков отличия
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resolvedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${badge.bg} ${badge.border} shadow-[0_0_12px_rgba(245,158,11,0.06)]`}
                  >
                    <div className="text-2xl shrink-0 p-1 rounded-lg bg-black/40 border border-white/5">
                      {badge.iconEmoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${badge.color || 'text-amber-300'}`}>
                          {badge.title}
                        </span>
                        {badge.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                            Орден
                          </span>
                        )}
                        {badge.isManuallyAssigned && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                            Админ
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-tight mt-0.5 truncate" title={badge.description}>
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Known coordinates / bases */}
          {playerCoordinates.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Известные координаты построек и событий
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {playerCoordinates.map((pc, idx) => (
                  <div
                    key={`${pc.eventId}-${idx}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-200 truncate">
                        {pc.eventTitle}
                      </p>
                      <span className="font-mono text-[11px] text-emerald-400">
                        X: {pc.coordinates.x},{' '}
                        {pc.coordinates.y !== undefined ? `Y: ${pc.coordinates.y}, ` : ''}
                        Z: {pc.coordinates.z}
                        {pc.coordinates.dimension && pc.coordinates.dimension !== 'overworld' && (
                          <span className="ml-1 text-[10px] text-rose-400 font-semibold">
                            ({pc.coordinates.dimension === 'nether' ? 'Незер' : 'Энд'})
                          </span>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => copyCoords(pc.coordinates, `${pc.eventId}-${idx}`)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors shrink-0"
                      title="Скопировать координаты"
                    >
                      {copiedCoordId === `${pc.eventId}-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-[#00e676]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History of Events with this player */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-300">
                  Хроника событий ({playerEvents.length})
                </h3>
              </div>
            </div>

            {playerEvents.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-2">
                В хронологии пока нет записей с участием этого игрока.
              </p>
            ) : (
              <div className="space-y-2">
                {playerEvents.map((evt) => {
                  const cat = EVENT_CATEGORIES[evt.type] || EVENT_CATEGORIES.event;
                  const Icon = cat.icon;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        onJumpToEvent(evt.id);
                        onClose();
                      }}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00e676]/40 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00e676] transition-colors truncate">
                            {evt.title}
                          </h4>
                          <span className="text-[11px] text-neutral-400">
                            {formatRussianDate(evt.date)}
                            {evt.season && ` • Сезон ${evt.season}`}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isBadgeEditorOpen && (
        <BadgeEditorModal
          isOpen={isBadgeEditorOpen}
          onClose={() => setIsBadgeEditorOpen(false)}
          player={effectiveProfile}
          events={events}
          onSavePlayer={(updated) => {
            onUpdatePlayerProfile?.(updated);
            setIsBadgeEditorOpen(false);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
