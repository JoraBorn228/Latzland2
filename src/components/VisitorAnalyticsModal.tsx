import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Activity,
  Users,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  RefreshCw,
  Trash2,
  Calendar,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  Search,
  UserCheck,
  Clock,
  Laptop,
} from 'lucide-react';
import { VisitorAnalyticsData, VisitorLog } from '../types';
import { apiAdmin } from '../utils/api';
import { getMinecraftHeadUrl } from '../utils/playerUtils';

interface VisitorAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export const VisitorAnalyticsModal: React.FC<VisitorAnalyticsModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
}) => {
  const [data, setData] = useState<VisitorAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'players'>('overview');
  const [logSearch, setLogSearch] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchAnalytics = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiAdmin.getVisitorAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load visitor analytics:', err);
      setError('Не удалось загрузить данные аналитики. Проверьте права администратора.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchAnalytics();
    }
  }, [isOpen, isAdmin]);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await apiAdmin.clearVisitorLogs();
      setShowClearConfirm(false);
      await fetchAnalytics();
    } catch (err) {
      console.error('Failed to clear logs:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!data?.recentLogs) return [];
    if (!logSearch.trim()) return data.recentLogs;
    const q = logSearch.toLowerCase().trim();
    return data.recentLogs.filter(
      (log) =>
        log.ipMasked.toLowerCase().includes(q) ||
        (log.playerNick && log.playerNick.toLowerCase().includes(q)) ||
        log.browser.toLowerCase().includes(q) ||
        log.os.toLowerCase().includes(q) ||
        log.path.toLowerCase().includes(q) ||
        log.referrer.toLowerCase().includes(q)
    );
  }, [data?.recentLogs, logSearch]);

  if (!isOpen) return null;

  const maxDailyViews = data?.dailyHistory
    ? Math.max(...data.dailyHistory.map((d) => d.views), 1)
    : 1;

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-blue-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-neutral-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#161616] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Аналитика посещений сайта
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ТОЛЬКО ДЛЯ АДМИНА
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Журнал трафика, источники переходов и активность игроков на сайте
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors border border-white/10 disabled:opacity-50"
              title="Обновить аналитику"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00e676]' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10 bg-[#141414] shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Обзор и графики</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Журнал визитов ({data?.recentLogs?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'players'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Игроки на сайте ({data?.identifiedPlayerVisits?.length || 0})</span>
            </button>
          </div>

          {/* Clear Logs confirmation */}
          <div className="flex items-center gap-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/40 px-2 py-1 rounded-lg animate-fadeIn">
                <span className="text-[11px] text-red-200">Очистить всю историю?</span>
                <button
                  onClick={handleClearLogs}
                  disabled={isClearing}
                  className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                >
                  {isClearing ? '...' : 'Да'}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="p-0.5 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
                title="Очистить накопленную историю визитов"
              >
                <Trash2 className="w-3 h-3" />
                <span>Очистить логи</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && !data && (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
              <p className="text-sm">Загрузка данных веб-аналитики...</p>
            </div>
          )}

          {data && activeTab === 'overview' && (
            <>
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Гостей сегодня</span>
                    <Users className="w-4 h-4 text-[#00e676]" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {data.uniqueVisitorsToday}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Всего за всё время: <strong className="text-neutral-300">{data.uniqueVisitorsAllTime}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Просмотров сегодня</span>
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {data.totalVisitsToday}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Всего просмотров: <strong className="text-neutral-300">{data.totalVisitsAllTime}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Авторизовано игроков</span>
                    <UserCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {data.identifiedPlayerVisits.length}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Посещали Личный кабинет
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#181818] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-neutral-400 text-xs">
                    <span>Мобильные визиты</span>
                    <Smartphone className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {data.deviceBreakdown['mobile'] || 0}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    ПК: {data.deviceBreakdown['desktop'] || 0}
                  </div>
                </div>
              </div>

              {/* 14-Day Traffic History Bar Chart */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#161616] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Динамика посещаемости (последние 14 дней)
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-purple-500" />
                      <span>Просмотры</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-[#00e676]" />
                      <span>Уникальные гости</span>
                    </span>
                  </div>
                </div>

                {/* Bars */}
                <div className="pt-4 pb-2">
                  <div className="grid grid-cols-14 gap-1 sm:gap-2 items-end h-36 border-b border-white/10 pb-2">
                    {data.dailyHistory.map((day, idx) => {
                      const viewsPercent = Math.max(
                        (day.views / maxDailyViews) * 100,
                        day.views > 0 ? 8 : 2
                      );
                      const uniquesPercent = Math.max(
                        (day.uniques / maxDailyViews) * 100,
                        day.uniques > 0 ? 6 : 2
                      );
                      const isToday = idx === data.dailyHistory.length - 1;

                      return (
                        <div
                          key={day.date}
                          className="flex flex-col items-center justify-end h-full group relative"
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-neutral-900 border border-white/20 text-white text-[10px] px-2 py-1 rounded shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
                            <div className="font-bold">{day.date}</div>
                            <div>👁️ {day.views} просмотров</div>
                            <div>👥 {day.uniques} уникальных</div>
                          </div>

                          <div className="w-full flex items-end justify-center gap-0.5 h-full">
                            <div
                              style={{ height: `${viewsPercent}%` }}
                              className={`w-1/2 rounded-t transition-all ${
                                isToday
                                  ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.4)]'
                                  : 'bg-purple-600/80 group-hover:bg-purple-400'
                              }`}
                            />
                            <div
                              style={{ height: `${uniquesPercent}%` }}
                              className={`w-1/2 rounded-t transition-all ${
                                isToday
                                  ? 'bg-[#00e676] shadow-[0_0_8px_rgba(0,230,118,0.4)]'
                                  : 'bg-emerald-600/80 group-hover:bg-[#00e676]'
                              }`}
                            />
                          </div>
                          <span
                            className={`text-[9px] font-mono mt-1 ${
                              isToday ? 'text-[#00e676] font-bold' : 'text-neutral-500'
                            }`}
                          >
                            {day.date.slice(8, 10)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Breakdown Grid: Referrers, Top Pages & Devices */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Referrers */}
                <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-white">Источники переходов</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {data.topReferrers.length > 0 ? (
                      data.topReferrers.map((ref) => (
                        <div key={ref.referrer} className="flex items-center justify-between">
                          <span className="text-neutral-300 truncate max-w-[170px]" title={ref.referrer}>
                            {ref.referrer}
                          </span>
                          <span className="font-mono font-bold text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                            {ref.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-500 text-xs py-2">Переходов пока не зафиксировано</p>
                    )}
                  </div>
                </div>

                {/* Popular Pages */}
                <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#00e676]" />
                    <h3 className="text-xs font-bold text-white">Популярные разделы</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {data.topVisitedPages.length > 0 ? (
                      data.topVisitedPages.map((page) => (
                        <div key={page.path} className="flex items-center justify-between">
                          <span className="text-neutral-300 truncate max-w-[170px]" title={page.path}>
                            {page.path === '/' ? 'Летопись (Главная)' : page.path}
                          </span>
                          <span className="font-mono font-bold text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                            {page.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-500 text-xs py-2">Данные собираются</p>
                    )}
                  </div>
                </div>

                {/* Devices & Browsers */}
                <div className="p-4 rounded-xl bg-[#161616] border border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white">Устройства и браузеры</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    {Object.entries(data.browserBreakdown).length > 0 ? (
                      Object.entries(data.browserBreakdown).map(([browser, count]) => (
                        <div key={browser} className="flex items-center justify-between">
                          <span className="text-neutral-300">{browser}</span>
                          <span className="font-mono font-bold text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                            {count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-500 text-xs py-2">Сбор данных</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {data && activeTab === 'logs' && (
            <div className="space-y-3">
              {/* Search in logs */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Поиск по IP, никнейму игрока, браузеру или разделу..."
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Logs Table */}
              <div className="rounded-xl border border-white/10 bg-[#161616] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1c1c1c] text-neutral-400 text-[11px] border-b border-white/10 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-2.5">Время</th>
                        <th className="px-4 py-2.5">IP (Маскирован)</th>
                        <th className="px-4 py-2.5">Устройство / ОС</th>
                        <th className="px-4 py-2.5">Раздел</th>
                        <th className="px-4 py-2.5">Источник</th>
                        <th className="px-4 py-2.5">Игрок</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 text-neutral-300 font-mono whitespace-nowrap">
                              <span className="text-neutral-400 text-[10px] mr-1">
                                {formatDate(log.timestamp)}
                              </span>
                              <span>{formatTimestamp(log.timestamp)}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-neutral-400 whitespace-nowrap">
                              {log.ipMasked}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                {getDeviceIcon(log.deviceType)}
                                <span>
                                  {log.os} / {log.browser}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-neutral-300 font-mono text-[11px] truncate max-w-[150px]">
                              {log.path}
                            </td>
                            <td className="px-4 py-2.5 text-neutral-400 text-[11px] truncate max-w-[140px]">
                              {log.referrer}
                            </td>
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {log.playerNick ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px]">
                                  <img
                                    src={getMinecraftHeadUrl(log.playerNick, 16)}
                                    alt={log.playerNick}
                                    className="w-3.5 h-3.5 rounded shrink-0"
                                  />
                                  <span>{log.playerNick}</span>
                                </span>
                              ) : (
                                <span className="text-neutral-500 text-[11px]">Гость</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                            {logSearch ? 'Ничего не найдено по вашему запросу' : 'Логов визитов пока нет'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {data && activeTab === 'players' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Список игроков сервера, которые авторизовались в Личном кабинете и просматривали хроники:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.identifiedPlayerVisits.length > 0 ? (
                  data.identifiedPlayerVisits.map((p) => (
                    <div
                      key={p.playerNick}
                      className="p-3.5 rounded-xl bg-[#181818] border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getMinecraftHeadUrl(p.playerNick, 36)}
                          alt={p.playerNick}
                          className="w-9 h-9 rounded-lg border border-white/15 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">
                            {p.playerNick}
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>
                              Был на сайте: {formatDate(p.lastSeenOnSite)} в {formatTimestamp(p.lastSeenOnSite)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-purple-300">
                          {p.visitCount}
                        </div>
                        <div className="text-[10px] text-neutral-500">просмотров</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-neutral-500 text-xs">
                    Пока никто из игроков не авторизовался в личном кабинете на сайте
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#161616] shrink-0 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00e676]" />
            <span>Данные конфиденциальны и доступны только при активной сессии администратора</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
