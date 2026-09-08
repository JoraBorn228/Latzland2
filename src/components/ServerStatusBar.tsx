import React, { useState } from 'react';
import {
  Server,
  Copy,
  Check,
  RefreshCw,
  Users,
  Activity,
  Globe,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { MinecraftServerStatus, ServerAnalyticsData, PlayerProfile, ServerOnlineSnapshot } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { formatPlaytime } from '../utils/playerUtils';

interface ServerStatusBarProps {
  status: MinecraftServerStatus;
  analytics?: ServerAnalyticsData | null;
  playersDatabase?: PlayerProfile[];
  onRefresh: () => void;
  onSelectPlayer?: (username: string) => void;
  onOpenPlayerProfile?: (username: string) => void;
  onOpenPlayersModal?: () => void;
  onShowToast: (msg: string) => void;
}

export const ServerStatusBar: React.FC<ServerStatusBarProps> = ({
  status,
  analytics,
  playersDatabase = [],
  onRefresh,
  onSelectPlayer,
  onOpenPlayerProfile,
  onOpenPlayersModal,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [hoveredSnapshotIndex, setHoveredSnapshotIndex] = useState<number | null>(null);

  const copyIp = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(status.ip);
    setCopied(true);
    onShowToast(`IP сервера скопирован: ${status.ip}`);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract recent 24 snapshots for the hourly online graph
  const recentSnapshots = (analytics?.hourlySnapshots || []).slice(-24);
  const maxHourlyOnline = Math.max(
    1,
    ...recentSnapshots.map((s) => s.onlineCount),
    analytics?.peakOnline || 0
  );

  // Format hour in user's local timezone (e.g. 23ч for MSK UTC+3 when server is in UTC)
  const formatLocalHour = (snap: ServerOnlineSnapshot): string => {
    try {
      if (snap.timestamp) {
        const d = new Date(snap.timestamp);
        if (!isNaN(d.getTime())) {
          return `${d.getHours()}ч`;
        }
      }
    } catch {
      // fallback
    }
    return snap.timeLabel ? `${snap.timeLabel.split(':')[0]}ч` : '';
  };

  // Format full date & time in user's local timezone for tooltip
  const formatLocalTooltipTime = (snap: ServerOnlineSnapshot): string => {
    try {
      if (snap.timestamp) {
        const d = new Date(snap.timestamp);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          return `${day}.${month} ${hours}:00`;
        }
      }
    } catch {
      // fallback
    }
    return `${snap.dateLabel ? `${snap.dateLabel} ` : ''}${snap.timeLabel}`;
  };

  const getPlayerPlural = (count: number): string => {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'игрок';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'игрока';
    return 'игроков';
  };

  return (
    <div className="relative mb-6 rounded-2xl bg-[#141414] border border-white/10 p-4 sm:p-5 shadow-xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Subtle background glow when online */}
      {status.online && (
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#00e676]/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Server Icon & Address & Version */}
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Server Favicon / Icon */}
          <div className="relative shrink-0">
            {status.icon ? (
              <img
                src={status.icon}
                alt="LatzLand Server Icon"
                className="w-12 h-12 rounded-xl object-cover border border-white/15 shadow-md"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00e676]/20 to-emerald-900/40 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] shadow-md">
                <Server className="w-6 h-6" />
              </div>
            )}

            {/* Online/Offline Status Indicator Dot */}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              {status.online ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00e676] border-2 border-[#141414]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[#141414]"></span>
              )}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                LatzLand SMP
              </span>

              {/* Version Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{status.version || '26.2 Java'}</span>
              </span>

              {/* Status pill */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  status.online
                    ? 'bg-[#00e676]/15 border border-[#00e676]/30 text-[#00e676]'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>{status.online ? 'Онлайн' : 'Офлайн'}</span>
              </span>

              {/* Peak Online record pill */}
              {analytics && analytics.peakOnline > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300"
                  title="Пиковый рекорд онлайна игроков"
                >
                  <TrendingUp className="w-3 h-3 text-amber-400" />
                  <span>Рекорд: {analytics.peakOnline}</span>
                </span>
              )}
            </div>

            {/* Address with click to copy */}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={copyIp}
                className="group/btn inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00e676]/40 transition-all text-xs font-mono text-neutral-200"
                title="Нажмите, чтобы скопировать IP"
              >
                <Globe className="w-3 h-3 text-neutral-400 group-hover/btn:text-[#00e676] transition-colors" />
                <span>{status.ip}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-[#00e676]" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-500 group-hover/btn:text-white transition-colors" />
                )}
              </button>

              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                (Java Edition 26.2)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Player Count, Hourly Analytics toggle & Refresh */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
          {/* Hourly Analytics Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showAnalytics
                ? 'bg-[#00e676]/20 border-[#00e676]/40 text-[#00e676]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
            }`}
            title="График почасового онлайна и статистика игроков"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Почасовой онлайн</span>
            {showAnalytics ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            {/* Player Counter Box */}
            <div className="bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/10 flex items-center justify-center text-[#00e676]">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                  Игроков на сервере
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-white leading-none">
                    {status.online ? status.onlinePlayers : 0}
                  </span>
                  {status.maxPlayers > 0 && (
                    <span className="text-xs text-neutral-400 font-medium">
                      / {status.maxPlayers}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={status.loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
              title="Обновить онлайн и запустить сбор статистики"
            >
              <RefreshCw
                className={`w-4 h-4 ${status.loading ? 'animate-spin text-[#00e676]' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Online Players List with Playtime badges */}
      {status.online && status.playerList.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5 mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse"></span>
            <span>Сейчас играют ({status.playerList.length}):</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {status.playerList.map((nick) => {
              const matchedProfile = playersDatabase.find(
                (p) => p.username.toLowerCase() === nick.toLowerCase()
              );
              const playtimeStr = formatPlaytime(matchedProfile?.totalOnlineMinutes);

              return (
                <button
                  key={nick}
                  type="button"
                  onClick={() => {
                    if (onOpenPlayerProfile) {
                      onOpenPlayerProfile(nick);
                    } else if (onSelectPlayer) {
                      onSelectPlayer(nick);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#00e676]/15 border border-white/10 hover:border-[#00e676]/30 text-xs text-neutral-200 hover:text-[#00e676] transition-all group/player"
                  title={`Открыть паспорт игрока ${nick} • Наиграно на сервере: ${playtimeStr}`}
                >
                  <PlayerAvatar username={nick} size={16} />
                  <span className="font-mono text-[11px] font-semibold">{nick}</span>
                  {matchedProfile?.totalOnlineMinutes && matchedProfile.totalOnlineMinutes > 0 ? (
                    <span className="text-[10px] px-1 py-0.2 rounded bg-white/5 text-neutral-400 group-hover/player:text-[#00e676]/90">
                      {playtimeStr}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Online Statistics Panel (Expandable) */}
      {showAnalytics && (
        <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#00e676]" />
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Почасовая статистика онлайна</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                  {recentSnapshots.length < 24 ? `зафиксировано ${recentSnapshots.length} ч.` : 'последние 24 часа'}
                </span>
              </h4>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {analytics && (
                <>
                  <span className="px-2 py-0.5 rounded bg-[#00e676]/10 border border-[#00e676]/30 text-[#00e676] font-semibold flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Отслеживается: {analytics.totalTrackedPlayers} игроков</span>
                  </span>
                  {analytics.autoRegisteredPlayersCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-medium">
                      🤖 Авто-реестр: {analytics.autoRegisteredPlayersCount}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hourly Bar Chart */}
          {recentSnapshots.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-neutral-400">
              <Clock className="w-5 h-5 text-neutral-500 mx-auto mb-1.5" />
              <span>Сервер ведет ежечасный сбор статистики онлайна. Первые снимки появятся в течение часа.</span>
            </div>
          ) : (
            <div className="bg-[#0e0e0e] border border-white/10 rounded-xl p-3.5">
              <div className={`flex items-end ${recentSnapshots.length < 12 ? 'justify-start gap-4' : 'justify-between gap-1'} h-28 pt-4 pb-1 overflow-x-auto`}>
                {recentSnapshots.map((snap, idx) => {
                  const heightPercent = Math.max(
                    8,
                    Math.round((snap.onlineCount / maxHourlyOnline) * 100)
                  );
                  const isHovered = hoveredSnapshotIndex === idx;

                  return (
                    <div
                      key={snap.id || idx}
                      onMouseEnter={() => setHoveredSnapshotIndex(idx)}
                      onMouseLeave={() => setHoveredSnapshotIndex(null)}
                      className={`${recentSnapshots.length < 12 ? 'w-10 flex-shrink-0' : 'flex-1 min-w-[20px] max-w-[40px]'} flex flex-col items-center gap-1 group/bar relative cursor-pointer`}
                    >
                      {/* Tooltip on hover */}
                      {isHovered && (
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 bg-neutral-900 border border-white/20 text-white rounded-lg p-2 text-[10px] whitespace-nowrap shadow-xl pointer-events-none">
                          <div className="font-bold text-[#00e676]">
                            {formatLocalTooltipTime(snap)}: {snap.onlineCount} {getPlayerPlural(snap.onlineCount)}
                          </div>
                          {snap.players && snap.players.length > 0 && (
                            <div className="text-neutral-400 truncate max-w-[160px]">
                              {snap.players.slice(0, 4).join(', ')}
                              {snap.players.length > 4 ? ` +${snap.players.length - 4}` : ''}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Online count label on top of bar */}
                      <span className="text-[9px] font-mono text-neutral-400 group-hover/bar:text-[#00e676] transition-colors">
                        {snap.onlineCount}
                      </span>

                      {/* Bar Fill */}
                      <div className="w-full bg-white/5 rounded-t-sm flex items-end h-16 relative overflow-hidden">
                        <div
                          className="w-full rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor:
                              snap.onlineCount > 0
                                ? isHovered
                                  ? '#00e676'
                                  : '#00c853'
                                : 'rgba(255,255,255,0.1)',
                          }}
                        />
                      </div>

                      {/* Hour label */}
                      <span className="text-[9px] font-mono text-neutral-500 group-hover/bar:text-neutral-300 transition-colors">
                        {formatLocalHour(snap)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400">
                <span>⏱️ Истинные замеры онлайна — история накапливается каждый час</span>
                {onOpenPlayersModal && (
                  <button
                    type="button"
                    onClick={onOpenPlayersModal}
                    className="text-[#00e676] hover:underline font-medium"
                  >
                    Реестр игроков и наигранные часы →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Server Rules / Vanilla Tag & MOTD */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 font-medium">
            ⛏️ Ванильное выживание
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 font-medium">
            🧭 Без телепортации
          </span>
          <a
            href="http://map.latzland.eu:29476/#world:8:70:7:50:1.61:0.78:0:0:perspective"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium transition-all"
            title="Открыть онлайн-карту сервера BlueMap"
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Карта BlueMap</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
          </a>
        </div>

        {status.motd && (
          <div className="font-mono italic text-neutral-400 truncate opacity-90 text-[10px] sm:text-[11px]">
            «{status.motd.split('\n')[0]}»
          </div>
        )}
      </div>
    </div>
  );
};

