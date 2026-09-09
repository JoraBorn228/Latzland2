import React, { useState, useMemo } from 'react';
import {
  Users,
  X,
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  ExternalLink,
  Shield,
  Key,
  MapPin,
  MessageSquare,
  Send,
  Copy,
  Download,
  Filter,
  Eye,
  EyeOff,
  UserCheck,
  Clock,
  Bot,
  CheckCircle2,
} from 'lucide-react';
import { PlayerProfile, LatzEvent, EventCoordinates } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { getPlayerColor, formatLastSeen } from '../utils/playerUtils';
import { validateMinecraftNick, sanitizeText } from '../utils/sanitizer';
import { hashPlayerPassword } from '../utils/security';
import { BadgeEditorModal } from './BadgeEditorModal';

interface PlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: PlayerProfile[];
  events?: LatzEvent[];
  onAddPlayer?: (player: PlayerProfile) => void;
  onUpdatePlayer?: (player: PlayerProfile) => void;
  onDeletePlayer?: (id: string) => void;
  onFilterByPlayer?: (username: string) => void;
  onSavePlayers?: (players: PlayerProfile[]) => void;
  isAdmin?: boolean;
  onShowToast: (msg: string) => void;
}

const formatHomeCoordinates = (c?: string | EventCoordinates): string => {
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c.y !== undefined ? `X: ${c.x}, Y: ${c.y}, Z: ${c.z}` : `X: ${c.x}, Z: ${c.z}`;
};

export const PlayersModal: React.FC<PlayersModalProps> = ({
  isOpen,
  onClose,
  players = [],
  events = [],
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onFilterByPlayer,
  onSavePlayers,
  isAdmin = false,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'registered' | 'auto'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'events' | 'date'>('events');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [badgeEditingPlayer, setBadgeEditingPlayer] = useState<PlayerProfile | null>(null);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);

  // Form states
  const [formNick, setFormNick] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formDiscord, setFormDiscord] = useState('');
  const [formTelegram, setFormTelegram] = useState('');
  const [formCoords, setFormCoords] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formIsAutoRegistered, setFormIsAutoRegistered] = useState(false);

  if (!isOpen) return null;

  // Counts for registration types
  const autoRegisteredCount = players.filter((p) => Boolean(p.isAutoRegistered)).length;
  const registeredCount = players.length - autoRegisteredCount;
  const withPasswordCount = players.filter((p) => Boolean(p.password)).length;

  // Count events for each player
  const playerEventCounts: Record<string, number> = {};
  const safeEvents = Array.isArray(events) ? events : [];
  safeEvents.forEach((ev) => {
    (ev.players || []).forEach((nick) => {
      const lower = nick.toLowerCase();
      playerEventCounts[lower] = (playerEventCounts[lower] || 0) + 1;
    });
  });

  // Extract unique roles for filtering
  const availableRoles = Array.from(
    new Set(
      players
        .map((p) => p.role?.trim())
        .filter((r): r is string => Boolean(r && r.length > 0))
    )
  ).sort();

  const filteredPlayers = players
    .filter((p) => {
      const q = search.trim().toLowerCase();
      const coordsStr = formatHomeCoordinates(p.homeCoordinates).toLowerCase();
      const matchSearch =
        !q ||
        p.username.toLowerCase().includes(q) ||
        (p.role && p.role.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.discord && p.discord.toLowerCase().includes(q)) ||
        (p.telegram && p.telegram.toLowerCase().includes(q)) ||
        coordsStr.includes(q);

      const matchRole =
        selectedRoleFilter === 'all' ||
        (p.role && p.role.toLowerCase() === selectedRoleFilter.toLowerCase());

      const matchRegistration =
        registrationFilter === 'all' ||
        (registrationFilter === 'registered' && !p.isAutoRegistered) ||
        (registrationFilter === 'auto' && Boolean(p.isAutoRegistered));

      return matchSearch && matchRole && matchRegistration;
    })
    .sort((a, b) => {
      if (sortBy === 'events') {
        const countA = playerEventCounts[a.username.toLowerCase()] || 0;
        const countB = playerEventCounts[b.username.toLowerCase()] || 0;
        if (countB !== countA) return countB - countA;
        return a.username.localeCompare(b.username);
      }
      if (sortBy === 'name') {
        return a.username.localeCompare(b.username);
      }
      if (sortBy === 'date') {
        const dateA = a.registeredAt || '2023-01-01';
        const dateB = b.registeredAt || '2023-01-01';
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

  const startEdit = (player: PlayerProfile) => {
    setEditingId(player.id);
    setFormNick(player.username);
    setFormRole(player.role || '');
    setFormDesc(player.description || '');
    setFormPassword(player.password || '');
    setFormDiscord(player.discord || '');
    setFormTelegram(player.telegram || '');
    setFormCoords(formatHomeCoordinates(player.homeCoordinates));
    setFormColor(player.color || getPlayerColor(player.username));
    setFormIsAutoRegistered(Boolean(player.isAutoRegistered));
    setIsAdding(false);
  };

  const cancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormNick('');
    setFormRole('');
    setFormDesc('');
    setFormPassword('');
    setFormDiscord('');
    setFormTelegram('');
    setFormCoords('');
    setFormColor('');
    setFormIsAutoRegistered(false);
    setShowPasswordInForm(false);
  };

  const handleToggleRegistrationStatus = (player: PlayerProfile) => {
    const nextStatus = !player.isAutoRegistered;
    const updated: PlayerProfile = {
      ...player,
      isAutoRegistered: nextStatus,
    };
    if (onUpdatePlayer) {
      onUpdatePlayer(updated);
    } else if (onSavePlayers) {
      onSavePlayers(players.map((p) => (p.id === player.id ? updated : p)));
    }
    onShowToast(
      nextStatus
        ? `Игрок «${player.username}» помечен как авто-запись сервера`
        : `Регистрация игрока «${player.username}» официально подтверждена`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawNick = formNick.trim();
    const nickValidation = validateMinecraftNick(rawNick);
    if (!nickValidation.valid) {
      onShowToast(nickValidation.errorMessage || 'Некорректный никнейм Minecraft');
      return;
    }
    const cleanNick = nickValidation.cleanNick;

    if (editingId) {
      // Update
      const existing = players.find((p) => p.id === editingId);
      let newHashedPass = existing?.password;
      if (formPassword.trim()) {
        if (!formPassword.startsWith('sha256$')) {
          newHashedPass = await hashPlayerPassword(formPassword.trim(), cleanNick);
        } else {
          newHashedPass = formPassword.trim();
        }
      }

      const updated: PlayerProfile = {
        ...(existing || {}),
        id: editingId,
        username: cleanNick,
        role: sanitizeText(formRole) || undefined,
        description: sanitizeText(formDesc) || undefined,
        password: newHashedPass,
        discord: sanitizeText(formDiscord) || undefined,
        telegram: sanitizeText(formTelegram) || undefined,
        homeCoordinates: sanitizeText(formCoords) || undefined,
        color: formColor || getPlayerColor(cleanNick),
        registeredAt: existing?.registeredAt || new Date().toISOString().split('T')[0],
        isAutoRegistered: formIsAutoRegistered,
      };

      if (onUpdatePlayer) {
        onUpdatePlayer(updated);
      } else if (onSavePlayers) {
        onSavePlayers(players.map((p) => (p.id === editingId ? updated : p)));
      }
      onShowToast(`Игрок ${cleanNick} обновлен в базе данных`);
    } else {
      // Add
      const exists = players.some(
        (p) => p.username.toLowerCase() === cleanNick.toLowerCase()
      );
      if (exists) {
        onShowToast(`Игрок с ником «${cleanNick}» уже существует в базе`);
        return;
      }

      let newHashedPass: string | undefined = undefined;
      if (formPassword.trim()) {
        newHashedPass = await hashPlayerPassword(formPassword.trim(), cleanNick);
      }

      const newP: PlayerProfile = {
        id: `player-${cleanNick.toLowerCase().replace(/[^a-z0-9_]/g, '') || String(Date.now())}`,
        username: cleanNick,
        role: sanitizeText(formRole) || undefined,
        description: sanitizeText(formDesc) || undefined,
        password: newHashedPass,
        discord: sanitizeText(formDiscord) || undefined,
        telegram: sanitizeText(formTelegram) || undefined,
        homeCoordinates: sanitizeText(formCoords) || undefined,
        color: formColor || getPlayerColor(cleanNick),
        registeredAt: new Date().toISOString().split('T')[0],
        isAutoRegistered: formIsAutoRegistered,
      };

      if (onAddPlayer) {
        onAddPlayer(newP);
      } else if (onSavePlayers) {
        onSavePlayers([...players, newP]);
      }
      onShowToast(`Игрок ${cleanNick} добавлен в базу данных!`);
    }

    cancelForm();
  };

  const handleConfirmDelete = (player: PlayerProfile) => {
    if (onDeletePlayer) {
      onDeletePlayer(player.id);
    }
    if (onSavePlayers) {
      onSavePlayers(players.filter((p) => p.id !== player.id));
    }
    onShowToast(`Игрок ${player.username} удален из базы данных`);
    setDeletingPlayerId(null);
  };

  const handleExportPlayersJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(players, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `latzland_players_database_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('База игроков успешно экспортирована в JSON');
    } catch {
      onShowToast('Ошибка экспорта базы данных');
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`${label} скопировано: ${text}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#121212] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-b from-[#0e1d24] to-[#121212] border-b border-cyan-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  База данных игроков сервера
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {players.length} жителей
                </span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Админ-доступ</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Полный реестр игроков LatzLand, роли, контакты, координаты и участие в летописи
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPlayersJson}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs transition-all"
              title="Экспорт базы игроков в JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Экспорт JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
          {/* Admin Registration Overview & Filter Deck */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 animate-in fade-in duration-150">
              {/* All players */}
              <button
                type="button"
                onClick={() => setRegistrationFilter('all')}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  registrationFilter === 'all'
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-medium">Всего в базе</span>
                  <Users className="w-4 h-4 text-neutral-400" />
                </div>
                <div className="text-xl font-black text-white mt-1">{players.length}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Вся база данных игроков</div>
              </button>

              {/* Registered players */}
              <button
                type="button"
                onClick={() => setRegistrationFilter('registered')}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  registrationFilter === 'registered'
                    ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_15px_rgba(0,230,118,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Зарегистрированы
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    {Math.round((registeredCount / (players.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="text-xl font-black text-emerald-300 mt-1">{registeredCount}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {withPasswordCount > 0 ? `${withPasswordCount} с паролем ЛК` : 'Официальные профили'}
                </div>
              </button>

              {/* Auto-recorded players */}
              <button
                type="button"
                onClick={() => setRegistrationFilter('auto')}
                className={`p-2.5 rounded-xl text-left transition-all border ${
                  registrationFilter === 'auto'
                    ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    Записаны автоматически
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                    {autoRegisteredCount}
                  </span>
                </div>
                <div className="text-xl font-black text-cyan-300 mt-1">{autoRegisteredCount}</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Зафиксированы сервером при заходе</div>
              </button>
            </div>
          )}

          {/* Action & Search Bar */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по нику, роли, описанию, Discord, Telegram, координатам..."
                  className="w-full bg-[#181818] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                />
              </div>

              {/* Role Filter & Sort */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {availableRoles.length > 0 && (
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-[#181818] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="all">Все роли ({players.length})</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#181818] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-neutral-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="events">По событиям</option>
                  <option value="name">По алфавиту</option>
                  <option value="date">По дате регистрации</option>
                </select>

                {isAdmin && !isAdding && !editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(true);
                      setEditingId(null);
                      setFormNick('');
                      setFormRole('');
                      setFormDesc('');
                      setFormPassword('');
                      setFormDiscord('');
                      setFormTelegram('');
                      setFormCoords('');
                      setFormColor('');
                      setFormIsAutoRegistered(false);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)] flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Добавить игрока</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Tabs: Все / Зарегистрированные / Авто-записи */}
            <div className="flex items-center gap-1 bg-[#141414] p-1 rounded-xl border border-white/10 text-xs self-start flex-wrap">
              <button
                type="button"
                onClick={() => setRegistrationFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  registrationFilter === 'all'
                    ? 'bg-white/15 text-white shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Все ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setRegistrationFilter('registered')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                  registrationFilter === 'registered'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Зарегистрированные ({registeredCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setRegistrationFilter('auto')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-colors ${
                  registrationFilter === 'auto'
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-cyan-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                <span>Авто-записи сервером ({autoRegisteredCount})</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Form Modal */}
          {(isAdding || editingId) && (
            <form
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl bg-[#181818] border border-cyan-500/40 space-y-3.5 animate-in fade-in duration-150 shadow-xl"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>
                    {editingId ? 'Редактирование профиля в базе данных' : 'Регистрация нового игрока в базе данных'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Отмена
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300">
                    Minecraft Никнейм *
                  </label>
                  <input
                    type="text"
                    value={formNick}
                    onChange={(e) => setFormNick(e.target.value)}
                    placeholder="Например: Notch, Alex_Miner"
                    required
                    className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300">
                    Роль / Титул (Строитель, Воин, Мэр...)
                  </label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Например: Архитектор"
                    className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300 flex items-center justify-between">
                    <span>Пароль аккаунта {isAdmin && '(Админ-сброс)'}</span>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      {showPasswordInForm ? 'Скрыть' : 'Показать'}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordInForm ? 'text' : 'password'}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingId ? 'Оставьте пустым, чтобы не менять' : 'Пароль для входа в кабинет'}
                      className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300">
                    Discord тег
                  </label>
                  <input
                    type="text"
                    value={formDiscord}
                    onChange={(e) => setFormDiscord(e.target.value)}
                    placeholder="username / nick#0000"
                    className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={formTelegram}
                    onChange={(e) => setFormTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-neutral-300">
                    Координаты базы (X, Y, Z)
                  </label>
                  <input
                    type="text"
                    value={formCoords}
                    onChange={(e) => setFormCoords(e.target.value)}
                    placeholder="X: 100, Y: 70, Z: -250"
                    className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-neutral-300">
                  Биография / Заметки об игроке
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="История персонажа, построенные базы, кланы, памятные поступки..."
                  className="w-full bg-[#202020] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {formNick.trim() && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300">
                  <PlayerAvatar username={formNick.trim()} size={28} />
                  <span>
                    Предпросмотр скина для никнейма <strong>{formNick.trim()}</strong>
                  </span>
                </div>
              )}

              {/* Registration status selector for admin */}
              {isAdmin && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Тип записи в базе игроков
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      {formIsAutoRegistered
                        ? '🤖 Автоматическая запись сервера (зафиксирован при заходе)'
                        : '✅ Полноценно зарегистрированный профиль игрока'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-white/10 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFormIsAutoRegistered(false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        !formIsAutoRegistered
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Зарегистрирован</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsAutoRegistered(true)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                        formIsAutoRegistered
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Авто-запись</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{editingId ? 'Сохранить изменения' : 'Зарегистрировать игрока'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Players List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredPlayers.map((player) => {
              const eventCount = playerEventCounts[player.username.toLowerCase()] || 0;
              const playerColor = player.color || getPlayerColor(player.username);

              return (
                <div
                  key={player.id}
                  className="p-4 rounded-2xl bg-[#161616] border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <div>
                    {/* Player Header */}
                    <div className="flex items-start gap-3.5">
                      <div className="relative shrink-0">
                        <PlayerAvatar username={player.username} size={44} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-sm text-white truncate flex items-center gap-1.5 flex-wrap">
                            <span style={{ color: playerColor }}>{player.username}</span>
                            <button
                              onClick={() => handleCopyText(player.username, 'Никнейм')}
                              className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white transition-opacity"
                              title="Скопировать ник"
                            >
                              <Copy className="w-3 h-3" />
                            </button>

                            {/* Registration Badge */}
                            {player.isAutoRegistered ? (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-semibold inline-flex items-center gap-1"
                                title="Игрок добавлен сервером автоматически при обнаружении в игре (Личный кабинет ещё не активирован)"
                              >
                                <Bot className="w-3 h-3 text-cyan-400" />
                                <span>Авто-запись</span>
                              </span>
                            ) : (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 font-semibold inline-flex items-center gap-1"
                                title="Официально зарегистрированный профиль игрока"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Зарегистрирован</span>
                              </span>
                            )}

                            {isAdmin && player.password && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium inline-flex items-center gap-1"
                                title="Пароль установлен: игрок может входить в личный кабинет"
                              >
                                <Key className="w-2.5 h-2.5 text-amber-400" />
                                <span className="hidden sm:inline">Пароль задан</span>
                              </span>
                            )}
                          </h4>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {player.role && (
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate"
                                style={{
                                  backgroundColor: `${playerColor}15`,
                                  borderColor: `${playerColor}40`,
                                  color: playerColor,
                                }}
                              >
                                {player.role}
                              </span>
                            )}
                          </div>
                        </div>

                        {player.description && (
                          <p className="text-xs text-neutral-300/90 mt-1 line-clamp-2 leading-relaxed">
                            {player.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata / Details */}
                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-neutral-400">
                      {player.homeCoordinates && (
                        <div
                          onClick={() => handleCopyText(formatHomeCoordinates(player.homeCoordinates), 'Координаты')}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer transition-colors"
                          title="Нажмите, чтобы скопировать координаты"
                        >
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="truncate font-mono">{formatHomeCoordinates(player.homeCoordinates)}</span>
                        </div>
                      )}

                      {player.discord && (
                        <div
                          onClick={() => handleCopyText(player.discord!, 'Discord')}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer transition-colors"
                          title="Нажмите, чтобы скопировать Discord"
                        >
                          <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{player.discord}</span>
                        </div>
                      )}

                      {player.telegram && (
                        <div
                          onClick={() => handleCopyText(player.telegram!, 'Telegram')}
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer transition-colors"
                          title="Нажмите, чтобы скопировать Telegram"
                        >
                          <Send className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{player.telegram}</span>
                        </div>
                      )}

                      {player.lastSeen ? (
                        <div
                          className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03]"
                          title={`Последняя активность на сервере: ${player.lastSeen}`}
                        >
                          <UserCheck className="w-3 h-3 text-[#00e676] shrink-0" />
                          <span className="truncate">{formatLastSeen(player.lastSeen)}</span>
                        </div>
                      ) : player.registeredAt ? (
                        <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/[0.03]">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">Рег: {player.registeredAt}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (onFilterByPlayer) {
                          onFilterByPlayer(player.username);
                        }
                        onClose();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-cyan-300 font-medium transition-colors"
                      title="Нажмите, чтобы увидеть все события этого игрока в летописи"
                    >
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>
                        События в летописи: <strong className="text-white">{eventCount}</strong>
                      </span>
                    </button>

                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleRegistrationStatus(player)}
                          className={`px-2 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                            player.isAutoRegistered
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-400 hover:text-neutral-200'
                          }`}
                          title={
                            player.isAutoRegistered
                              ? 'Подтвердить официальную регистрацию игрока (снять статус авто-записи)'
                              : 'Перевести игрока в статус автоматической записи'
                          }
                        >
                          {player.isAutoRegistered ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="hidden sm:inline">Подтвердить</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="hidden sm:inline">Сделать авто</span>
                            </>
                          )}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setBadgeEditingPlayer(player)}
                          className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                          title="Редактировать знаки отличия игрока"
                        >
                          🎖️
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => startEdit(player)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors"
                          title="Редактировать данные игрока"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && (deletingPlayerId === player.id ? (
                        <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/50 rounded-lg px-1.5 py-0.5 animate-in fade-in duration-100">
                          <span className="text-[10px] text-red-200 font-medium whitespace-nowrap">
                            Удалить?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(player)}
                            className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                          >
                            Да
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingPlayerId(null)}
                            className="p-0.5 rounded text-neutral-400 hover:text-white transition-colors"
                            title="Отмена"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingPlayerId(player.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-colors"
                          title="Удалить игрока из базы"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPlayers.length === 0 && (
            <div className="text-center py-12 space-y-2 text-neutral-500 text-xs">
              <Users className="w-8 h-8 mx-auto text-neutral-600" />
              <p>Игроки не найдены по запросу «{search}».</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedRoleFilter('all');
                }}
                className="text-cyan-400 hover:underline"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-white/10 bg-[#0e0e0e] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>База данных синхронизируется в реальном времени с локальным хранилищем и заявками</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>

      {badgeEditingPlayer && (
        <BadgeEditorModal
          isOpen={Boolean(badgeEditingPlayer)}
          onClose={() => setBadgeEditingPlayer(null)}
          player={badgeEditingPlayer}
          events={events}
          onSavePlayer={(updated) => {
            onUpdatePlayer?.(updated);
            setBadgeEditingPlayer(null);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};

