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
    ...recentSnapshots.map((s) => (typeof s.maxOnline === 'number' ? s.maxOnline : s.onlineCount)),
    analytics?.peakOnline || 0
  );

  // Format hour in user's local timezone (e.g. 23:00)
  const formatLocalHour = (snap: ServerOnlineSnapshot): string => {
    try {
      if (snap.timestamp) {
        const d = new Date(snap.timestamp);
        if (!isNaN(d.getTime())) {
          return `${String(d.getHours()).padStart(2, '0')}:00`;
        }
      }
    } catch {
      // fallback
    }
    if (snap.timeLabel) {
      const parts = snap.timeLabel.split(':');
      return `${parts[0].padStart(2, '0')}:00`;
    }
    return '';
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
    <div className="relative mb-6 rounded-2xl basalt-card border border-white/10 p-4 sm:p-5 shadow-2xl overflow-hidden group hover:border-white/20 transition-all">
      {/* Top neon accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(0,230,118,0.5) 20%, rgba(0,210,255,0.6) 60%, rgba(192,132,252,0.4) 90%, transparent 100%)',
        }}
      />

      {/* Subtle background glow when online */}
      {status.online && (
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br from-[#00e676]/15 to-[#00d2ff]/10 rounded-full blur-3xl pointer-events-none" />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Server Icon & Address & Version */}
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Server Favicon / Emblem with logo2.png */}
          <div className="relative shrink-0 group/emblem">
            <div className="w-12 h-12 rounded-xl p-1 bg-gradient-to-br from-[#00e676]/25 via-[#091510] to-[#00d2ff]/20 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_16px_rgba(0,230,118,0.25)] group-hover/emblem:shadow-[0_0_24px_rgba(0,230,118,0.45)] transition-all">
              <img
                src="/logo2.png"
                alt="LatzLand Emblem"
                className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] group-hover/emblem:scale-105 transition-transform"
              />
            </div>

            {/* Online/Offline Status Indicator Dot */}
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              {status.online ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00e676] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#00e676] border-2 border-[#090c12] shadow-[0_0_8px_#00e676]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-[#090c12]"></span>
              )}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                LatzLand
              </span>

              {/* Version Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{status.version || '26.2 Java'}</span>
              </span>

              {/* Status pill */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                  status.online
                    ? 'bg-[#00e676]/15 border border-[#00e676]/40 text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.2)]'
                    : 'bg-red-500/15 border border-red-500/30 text-red-400'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>{status.online ? 'Онлайн' : 'Офлайн'}</span>
              </span>

              {/* Peak Online record pill */}
              {analytics && analytics.peakOnline > 0 && (
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
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
                className="group/btn inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 hover:border-[#00e676]/50 transition-all text-xs font-mono text-neutral-200 shadow-sm"
                title="Нажмите, чтобы скопировать IP"
              >
                <Globe className="w-3 h-3 text-neutral-400 group-hover/btn:text-[#00e676] transition-colors" />
                <span className="font-semibold">{status.ip}</span>
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
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              showAnalytics
                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-[0_0_14px_rgba(0,210,255,0.3)]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white'
            }`}
            title="График почасового онлайна и статистика игроков"
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Эквалайзер онлайна</span>
            {showAnalytics ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            {/* Player Counter Box */}
            <div className="bg-[#090c12]/80 border border-white/12 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-inner">
              <div className="w-8 h-8 rounded-lg bg-[#00e676]/15 flex items-center justify-center text-[#00e676] shadow-[0_0_10px_rgba(0,230,118,0.25)]">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  В игре сейчас
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
              className="p-2 rounded-xl bg-[#090c12] hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
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
            {status.playerList.map((nick) => (
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
                title={`Открыть паспорт игрока ${nick}`}
              >
                <PlayerAvatar username={nick} size={16} />
                <span className="font-mono text-[11px] font-semibold">{nick}</span>
              </button>
            ))}
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

          {/* Hourly Neon Equalizer Chart */}
          {recentSnapshots.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-neutral-400">
              <Clock className="w-5 h-5 text-neutral-500 mx-auto mb-1.5" />
              <span>Сервер ведет ежечасный сбор статистики онлайна. Первые снимки появятся в течение часа.</span>
            </div>
          ) : (
            <div className="bg-[#080b11] border border-cyan-500/20 rounded-2xl p-4 shadow-inner relative overflow-hidden">
              {/* Equalizer ambient background light */}
              <div className="absolute top-0 right-1/4 w-40 h-20 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className={`flex items-end ${recentSnapshots.length < 12 ? 'justify-start gap-4' : 'justify-between gap-1'} h-32 pt-5 pb-1 overflow-x-auto`}>
                {recentSnapshots.map((snap, idx) => {
                  const peakOnline = typeof snap.maxOnline === 'number' ? snap.maxOnline : snap.onlineCount;
                  const finalOnline = typeof snap.finalOnline === 'number' ? snap.finalOnline : snap.onlineCount;
                  const heightPercent = Math.max(
                    8,
                    Math.round((peakOnline / maxHourlyOnline) * 100)
                  );
                  const isHovered = hoveredSnapshotIndex === idx;
                  const isPeak = peakOnline > 0 && peakOnline === maxHourlyOnline;

                  return (
                    <div
                      key={snap.id || idx}
                      onMouseEnter={() => setHoveredSnapshotIndex(idx)}
                      onMouseLeave={() => setHoveredSnapshotIndex(null)}
                      className={`${recentSnapshots.length < 12 ? 'w-10 flex-shrink-0' : 'flex-1 min-w-[22px] max-w-[42px]'} flex flex-col items-center gap-1 group/bar relative cursor-pointer`}
                    >
                      {/* Tooltip on hover with player heads & detailed max/final online stats */}
                      {isHovered && (
                        <div className="absolute -top-28 left-1/2 -translate-x-1/2 z-30 bg-[#090d14]/95 border border-cyan-500/40 backdrop-blur-md text-white rounded-xl p-3 text-[11px] whitespace-nowrap shadow-[0_12px_28px_rgba(0,0,0,0.85)] pointer-events-none min-w-[180px]">
                          <div className="flex items-center justify-between gap-3 font-bold border-b border-white/10 pb-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5 text-cyan-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span>{formatLocalTooltipTime(snap)}</span>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Всего: {snap.players?.length || finalOnline}
                            </span>
                          </div>

                          {/* Max vs Final Online Metrics */}
                          <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/[0.04] p-1.5 rounded-lg border border-white/5 font-mono mb-1.5">
                            <div>
                              <span className="text-neutral-400 block text-[9px]">Макс. за час:</span>
                              <span className="text-[#00d2ff] font-bold text-xs">↑ {peakOnline} {getPlayerPlural(peakOnline)}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400 block text-[9px]">Конечный:</span>
                              <span className="text-emerald-400 font-bold text-xs">→ {finalOnline} {getPlayerPlural(finalOnline)}</span>
                            </div>
                          </div>

                          {snap.players && snap.players.length > 0 ? (
                            <div className="flex items-center gap-1.5 pt-1 border-t border-white/10">
                              <div className="flex items-center -space-x-1">
                                {snap.players.slice(0, 3).map((p) => (
                                  <PlayerAvatar key={p} username={p} size={16} className="rounded-full border border-black/80" />
                                ))}
                              </div>
                              <span className="text-[10px] text-neutral-300 truncate max-w-[140px]">
                                {snap.players.slice(0, 3).join(', ')}
                                {snap.players.length > 3 ? ` +${snap.players.length - 3}` : ''}
                              </span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-neutral-500 italic">
                              Никто не заходил в этот час
                            </div>
                          )}
                        </div>
                      )}

                      {/* Online count labels on top of bar: Max & Final */}
                      <div className="flex flex-col items-center leading-none">
                        <span
                          title={`Пиковый (макс.) онлайн за час: ${peakOnline}`}
                          className={`text-[9px] font-mono font-bold transition-colors ${
                            isPeak
                              ? 'text-[#00d2ff] drop-shadow-[0_0_6px_rgba(0,210,255,0.85)]'
                              : isHovered
                              ? 'text-cyan-300'
                              : 'text-cyan-400/90 group-hover/bar:text-cyan-300'
                          }`}
                        >
                          ↑{peakOnline}
                        </span>
                        <span
                          title={`Конечный онлайн (на конец часа): ${finalOnline}`}
                          className={`text-[8px] font-mono font-medium transition-colors ${
                            isHovered ? 'text-emerald-300' : 'text-neutral-400 group-hover/bar:text-neutral-200'
                          }`}
                        >
                          →{finalOnline}
                        </span>
                      </div>

                      {/* Equalizer Bar Fill */}
                      <div className="w-full bg-white/[0.04] rounded-t-md flex flex-col justify-end h-20 relative overflow-hidden border-x border-t border-white/5">
                        <div
                          className="w-full rounded-t-md transition-all duration-300 relative"
                          style={{
                            height: `${heightPercent}%`,
                            background:
                              peakOnline > 0
                                ? isHovered
                                  ? 'linear-gradient(to top, #00e676 0%, #00d2ff 100%)'
                                  : 'linear-gradient(to top, #00c853 0%, #00b4d8 100%)'
                                : 'rgba(255,255,255,0.06)',
                            boxShadow:
                              peakOnline > 0
                                ? isPeak || isHovered
                                  ? '0 0 16px rgba(0, 210, 255, 0.4), inset 0 0 8px rgba(255,255,255,0.3)'
                                  : '0 0 8px rgba(0, 230, 118, 0.2)'
                                : undefined,
                          }}
                        >
                          {/* Glowing Neon Cap on top of bar */}
                          {peakOnline > 0 && (
                            <div
                              className="w-full h-1 rounded-t-md bg-[#00d2ff]"
                              style={{
                                boxShadow: '0 0 8px #00d2ff, 0 0 14px rgba(0, 210, 255, 0.8)',
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Hour label in HH:00 format */}
                      <span className="text-[9px] font-mono text-neutral-500 group-hover/bar:text-cyan-300 transition-colors whitespace-nowrap">
                        {formatLocalHour(snap)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 flex-wrap gap-2">
                <div className="flex items-center gap-3 text-neutral-400 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff] shadow-[0_0_6px_#00d2ff]" />
                    <span>Почасовой замер:</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
                    <span className="font-bold">↑</span>
                    <span>Максимум за час</span>
                  </span>
                  <span className="text-neutral-600">/</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="font-bold">→</span>
                    <span>Конечный (на конец часа)</span>
                  </span>
                </div>
                {onOpenPlayersModal && (
                  <button
                    type="button"
                    onClick={onOpenPlayersModal}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Реестр игроков и наигранные часы</span>
                    <span>→</span>
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

