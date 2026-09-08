import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Plus,
  Trash2,
  Sparkles,
  Check,
  RotateCcw,
  Shield,
  Star,
  Info,
  Calendar,
} from 'lucide-react';
import { PlayerProfile, LatzEvent, PlayerBadge } from '../types';
import { STANDARD_BADGES, StandardBadgeDefinition, resolvePlayerBadges } from '../utils/badgeUtils';
import { PlayerAvatar } from './PlayerAvatar';
import { sanitizeText } from '../utils/sanitizer';
import { logSecurityAudit } from '../utils/security';

interface BadgeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerProfile | null;
  events: LatzEvent[];
  onSavePlayer: (updated: PlayerProfile) => void;
  onShowToast: (msg: string) => void;
}

const EMOJI_PRESETS = [
  '🏆', '👑', '⚔️', '🛡️', '⛏️', '💎',
  '⚡', '🔥', '🧪', '📜', '🏹', '🌟',
  '🎯', '🐉', '🥇', '🥈', '🥉', '🚀',
  '🎭', '🧭', '🏛️', '💍', '🔮', '🕊️',
];

const COLOR_PRESETS = [
  { label: 'Золото', value: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/15' },
  { label: 'Изумруд', value: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/15' },
  { label: 'Рубин', value: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/15' },
  { label: 'Сапфир', value: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/15' },
  { label: 'Аметист', value: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/15' },
  { label: 'Пламя', value: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/15' },
  { label: 'Бирюза', value: 'text-teal-400', border: 'border-teal-500/40', bg: 'bg-teal-500/15' },
];

export const BadgeEditorModal: React.FC<BadgeEditorModalProps> = ({
  isOpen,
  onClose,
  player,
  events,
  onSavePlayer,
  onShowToast,
}) => {
  if (!isOpen || !player) return null;

  const [assignedBadges, setAssignedBadges] = useState<string[]>(
    player.assignedBadges || []
  );
  const [disabledBadges, setDisabledBadges] = useState<string[]>(
    player.disabledBadges || []
  );
  const [customBadges, setCustomBadges] = useState<PlayerBadge[]>(
    player.customBadges ? [...player.customBadges] : []
  );

  // New custom badge form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏆');
  const [newColor, setNewColor] = useState('text-amber-400');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Sync state when player prop changes
  useEffect(() => {
    if (player) {
      setAssignedBadges(player.assignedBadges || []);
      setDisabledBadges(player.disabledBadges || []);
      setCustomBadges(player.customBadges ? [...player.customBadges] : []);
    }
  }, [player]);

  // Temporary player object to preview badge resolution
  const previewPlayer: PlayerProfile = {
    ...player,
    assignedBadges,
    disabledBadges,
    customBadges,
  };

  const resolvedBadges = resolvePlayerBadges(previewPlayer, events);

  // Toggle standard badge mode: 'auto' | 'forced' | 'disabled'
  const getBadgeMode = (badgeId: string, badgeDef: StandardBadgeDefinition): 'auto' | 'forced' | 'disabled' => {
    if (disabledBadges.includes(badgeId)) return 'disabled';
    if (assignedBadges.includes(badgeId)) return 'forced';
    return 'auto';
  };

  const setBadgeMode = (badgeId: string, mode: 'auto' | 'forced' | 'disabled') => {
    if (mode === 'auto') {
      setAssignedBadges((prev) => prev.filter((id) => id !== badgeId));
      setDisabledBadges((prev) => prev.filter((id) => id !== badgeId));
    } else if (mode === 'forced') {
      setAssignedBadges((prev) => [...prev.filter((id) => id !== badgeId), badgeId]);
      setDisabledBadges((prev) => prev.filter((id) => id !== badgeId));
    } else if (mode === 'disabled') {
      setDisabledBadges((prev) => [...prev.filter((id) => id !== badgeId), badgeId]);
      setAssignedBadges((prev) => prev.filter((id) => id !== badgeId));
    }
  };

  const handleAddCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(newTitle);
    const cleanDesc = sanitizeText(newDesc);

    if (!cleanTitle) {
      onShowToast('Введите название знака отличия');
      return;
    }

    const badge: PlayerBadge = {
      id: `custom-badge-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc || undefined,
      icon: newEmoji || '🎖️',
      color: newColor,
      grantedAt: new Date().toISOString().split('T')[0],
      grantedBy: 'Администрация',
    };

    setCustomBadges((prev) => [...prev, badge]);
    setNewTitle('');
    setNewDesc('');
    setIsAddingCustom(false);
    onShowToast(`Орден «${cleanTitle}» добавлен в список!`);
  };

  const handleDeleteCustomBadge = (id: string) => {
    setCustomBadges((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    const updated: PlayerProfile = {
      ...player,
      assignedBadges: assignedBadges.length > 0 ? assignedBadges : undefined,
      disabledBadges: disabledBadges.length > 0 ? disabledBadges : undefined,
      customBadges: customBadges.length > 0 ? customBadges : undefined,
    };

    onSavePlayer(updated);
    logSecurityAudit(
      'admin_update_badges',
      `Администратор обновил знаки отличия для @${player.username}`
    );
    onShowToast(`Знаки отличия для @${player.username} успешно сохранены!`);
    onClose();
  };

  return (
    <div
      id="badge-editor-modal"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-3xl bg-[#141416] border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayerAvatar
              username={player.username}
              size={32}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Управление знаками отличия
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  @{player.username}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Настройка системных бейджей, ручная выдача и создание авторских орденов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Live Preview Box */}
          <div className="bg-neutral-900/70 border border-white/10 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Предпросмотр в паспорте ({resolvedBadges.length})
              </span>
              <span className="text-[11px] text-neutral-500">
                Итоговый вид на карточке игрока
              </span>
            </div>

            {resolvedBadges.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500 border border-dashed border-white/10 rounded-lg">
                У игрока сейчас нет активных знаков отличия
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {resolvedBadges.map((b) => (
                  <div
                    key={b.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${b.border} ${b.bg} ${b.color} transition-all shadow-sm`}
                    title={b.description}
                  >
                    <span className="text-sm">{b.iconEmoji}</span>
                    <span>{b.title}</span>
                    {b.isCustom && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-500/40">
                        Орден
                      </span>
                    )}
                    {b.isManuallyAssigned && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/30 text-cyan-200 border border-cyan-500/40">
                        Ручной
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 1: Standard System Badges */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Системные знаки отличия
                </h4>
                <p className="text-xs text-neutral-400">
                  Автоматически рассчитываются по летописи. Вы можете принудительно выдать или скрыть любой из них.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {STANDARD_BADGES.map((badge) => {
                const autoUnlocked = badge.check(player, events);
                const mode = getBadgeMode(badge.id, badge);

                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-xl border transition-all ${
                      mode === 'forced'
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : mode === 'disabled'
                        ? 'bg-red-500/5 border-red-500/20 opacity-60'
                        : autoUnlocked
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl shrink-0 p-1 rounded-lg bg-black/40 border border-white/5">
                          {badge.iconEmoji}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {badge.title}
                            </span>
                            {autoUnlocked && mode === 'auto' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Авто-открыт
                              </span>
                            )}
                            {mode === 'forced' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                                Принудительно
                              </span>
                            )}
                            {mode === 'disabled' && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                Скрыт
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mode selector buttons */}
                    <div className="grid grid-cols-3 gap-1 mt-2.5 pt-2 border-t border-white/5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setBadgeMode(badge.id, 'auto')}
                        className={`py-1 px-1.5 rounded text-center transition-colors ${
                          mode === 'auto'
                            ? 'bg-white/15 text-white font-medium shadow-sm'
                            : 'bg-black/30 text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Авто ({autoUnlocked ? 'Да' : 'Нет'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeMode(badge.id, 'forced')}
                        className={`py-1 px-1.5 rounded text-center transition-colors ${
                          mode === 'forced'
                            ? 'bg-amber-500 text-black font-bold shadow-sm'
                            : 'bg-black/30 text-neutral-400 hover:text-amber-300 hover:bg-amber-500/10'
                        }`}
                      >
                        ✓ Выдать
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgeMode(badge.id, 'disabled')}
                        className={`py-1 px-1.5 rounded text-center transition-colors ${
                          mode === 'disabled'
                            ? 'bg-red-500/80 text-white font-semibold shadow-sm'
                            : 'bg-black/30 text-neutral-400 hover:text-red-300 hover:bg-red-500/10'
                        }`}
                      >
                        ✕ Скрыть
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Administrator Awards / Medals */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Персональные авторские ордена и награды
                </h4>
                <p className="text-xs text-neutral-400">
                  Уникальные медали и знаки отличия за особые заслуги на сервере
                </p>
              </div>

              {!isAddingCustom && (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Создать орден</span>
                </button>
              )}
            </div>

            {/* Form for new custom badge */}
            {isAddingCustom && (
              <form
                onSubmit={handleAddCustomBadge}
                className="bg-neutral-900/90 border border-amber-500/30 rounded-xl p-4 mb-4 space-y-3.5 animate-fade-in"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Новый знак отличия для @{player.username}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="text-neutral-400 hover:text-white text-xs"
                  >
                    Отмена
                  </button>
                </div>

                {/* Emoji Selection */}
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1.5">
                    Иконка знака отличия:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-black/40 rounded-lg border border-white/10 custom-scrollbar">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewEmoji(emoji)}
                        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-transform ${
                          newEmoji === emoji
                            ? 'bg-amber-500/30 border border-amber-500 scale-110 shadow-sm'
                            : 'hover:bg-white/10 border border-transparent'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Название ордена / титула *
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Например: Мастер Редстоуна"
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400"
                      maxLength={60}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">
                      Цветовая гамма:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_PRESETS.slice(0, 4).map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setNewColor(c.value)}
                          className={`py-1.5 px-2 rounded text-[11px] font-medium border text-center transition-all ${
                            newColor === c.value
                              ? `${c.border} ${c.bg} ${c.value} font-bold shadow-sm ring-1 ring-white/20`
                              : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1">
                    Описание заслуги (за что выдан):
                  </label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Например: За создание автоматизированного метро спавна"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400"
                    maxLength={140}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingCustom(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Добавить орден</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of existing custom badges */}
            {customBadges.length === 0 && !isAddingCustom ? (
              <div className="text-center py-6 text-xs text-neutral-500 border border-dashed border-white/10 rounded-xl">
                У игрока пока нет авторских орденов от администрации. Нажмите «Создать орден» выше, чтобы наградить игрока.
              </div>
            ) : (
              <div className="space-y-2">
                {customBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/20 flex items-center justify-between gap-3 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-1.5 rounded-lg bg-black/50 border border-white/10">
                        {badge.icon || '🎖️'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${badge.color || 'text-amber-300'}`}>
                            {badge.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Особая награда
                          </span>
                        </div>
                        {badge.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {badge.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {badge.grantedAt || 'Не указано'}
                          </span>
                          <span>•</span>
                          <span>Выдал: {badge.grantedBy || 'Администрация'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomBadge(badge.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Удалить этот орден"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setAssignedBadges([]);
              setDisabledBadges([]);
              onShowToast('Сброшено на авторасчёт');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить системные на авто</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-[#00e676] hover:bg-[#00c853] text-black transition-colors flex items-center gap-1.5 shadow-md shadow-[#00e676]/20"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Сохранить знаки отличия</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
