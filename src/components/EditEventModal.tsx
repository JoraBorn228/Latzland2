import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Copy,
  Check,
  Code,
  MapPin,
  Users,
  Eye,
  Info,
  CopyPlus,
  Star,
  GitBranch,
} from 'lucide-react';
import { EventType, EVENT_CATEGORIES, LatzEvent, PlayerProfile } from '../types';
import { ImageUploader } from './ImageUploader';
import { PlayerSelector } from './PlayerSelector';
import { sanitizeText, sanitizeUrl, validateCoordinates } from '../utils/sanitizer';

interface EditEventModalProps {
  isOpen: boolean;
  event: LatzEvent | null;
  onClose: () => void;
  onSaveEvent: (updatedEvent: LatzEvent) => void;
  onDeleteEvent: (id: string) => void;
  onDuplicateEvent: (event: LatzEvent) => void;
  onShowToast: (msg: string) => void;
  availablePlayers: PlayerProfile[];
  onAddNewPlayerToDb: (newPlayer: PlayerProfile) => void;
  onOpenPlayerManager: () => void;
  allEvents: LatzEvent[];
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  event,
  onClose,
  onSaveEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onShowToast,
  availablePlayers,
  onAddNewPlayerToDb,
  onOpenPlayerManager,
  allEvents = [],
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [important, setImportant] = useState(false);
  const [season, setSeason] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Branching
  const [parentId, setParentId] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [isBranchSectionOpen, setIsBranchSectionOpen] = useState(false);

  // Coordinates
  const [enableCoords, setEnableCoords] = useState(false);
  const [coordX, setCoordX] = useState<string>('');
  const [coordY, setCoordY] = useState<string>('64');
  const [coordZ, setCoordZ] = useState<string>('');
  const [coordDimension, setCoordDimension] = useState<'overworld' | 'nether' | 'the_end'>('overworld');

  // Players
  const [playersList, setPlayersList] = useState<string[]>([]);

  // Preview tab
  const [showPreview, setShowPreview] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state whenever event changes
  useEffect(() => {
    if (event) {
      setShowDeleteConfirm(false);
      setTitle(event.title || '');
      setDate(event.date || '');
      setType(event.type || 'event');
      setImportant(Boolean(event.important));
      setSeason(event.season || 1);
      setDescription(event.description || '');
      setLink(event.link || '');
      setImageUrl(event.imageUrl || '');
      setParentId(event.parentId || '');
      setBranchName(event.branchName || '');
      setIsBranchSectionOpen(Boolean(event.parentId));

      if (event.coordinates) {
        setEnableCoords(true);
        setCoordX(String(event.coordinates.x ?? ''));
        setCoordY(String(event.coordinates.y ?? '64'));
        setCoordZ(String(event.coordinates.z ?? ''));
        setCoordDimension(event.coordinates.dimension || 'overworld');
      } else {
        setEnableCoords(false);
        setCoordX('');
        setCoordY('64');
        setCoordZ('');
        setCoordDimension('overworld');
      }

      setPlayersList(event.players ? [...event.players] : []);
      setShowPreview(false);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const buildUpdatedEvent = (): LatzEvent => {
    const validCoords = enableCoords ? validateCoordinates(coordX, coordY, coordZ) : null;

    return {
      ...event,
      title: sanitizeText(title) || 'Без названия',
      date: date || event.date,
      type,
      important,
      season: Math.max(1, Math.min(20, Number(season) || 1)),
      description: sanitizeText(description) || undefined,
      link: sanitizeUrl(link) || undefined,
      imageUrl: sanitizeUrl(imageUrl) || undefined,
      players: playersList.length > 0 ? playersList.map(p => sanitizeText(p)).filter(Boolean) : undefined,
      parentId: parentId || undefined,
      branchName: sanitizeText(branchName) || undefined,
      coordinates:
        validCoords && validCoords.valid
          ? {
              x: validCoords.x,
              y: validCoords.y,
              z: validCoords.z,
              dimension: coordDimension,
            }
          : undefined,
    };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Введите название события');
      return;
    }
    const updated = buildUpdatedEvent();
    onSaveEvent(updated);
    onShowToast(`Событие «${updated.title}» успешно обновлено!`);
    onClose();
  };

  const handleDuplicate = () => {
    const updated = buildUpdatedEvent();
    const cloned: LatzEvent = {
      ...updated,
      id: `ev-${Date.now()}`,
      title: `${updated.title} (копия)`,
    };
    onDuplicateEvent(cloned);
    onShowToast(`Создана копия события «${cloned.title}»`);
    onClose();
  };

  const handleCopyJson = () => {
    const updated = buildUpdatedEvent();
    navigator.clipboard.writeText(JSON.stringify(updated, null, 2));
    setCopiedCode(true);
    onShowToast('JSON события скопирован!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-[#00e676] flex items-center justify-center border border-[#00e676]/30">
              <Save className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Редактировать событие
              </h2>
              <p className="text-xs text-neutral-400">
                ID: {event.id} &nbsp;•&nbsp; Сезон {season}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Form / Preview */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/5 bg-[#161616]">
          <button
            onClick={() => setShowPreview(false)}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all ${
              !showPreview
                ? 'border-[#00e676] text-[#00e676]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Редактирование
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              showPreview
                ? 'border-[#00e676] text-[#00e676]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Предпросмотр</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
          {!showPreview ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Branching Section (Разветвление события) */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-neutral-200 text-xs">
                      Разветвление события
                    </span>
                    {parentId && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-500/30 text-purple-300 font-medium">
                        Ветка активна
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isBranchSectionOpen && parentId) {
                        setParentId('');
                        setBranchName('');
                      }
                      setIsBranchSectionOpen(!isBranchSectionOpen);
                    }}
                    className="text-[11px] text-purple-300 hover:text-white transition-colors"
                  >
                    {isBranchSectionOpen
                      ? parentId
                        ? 'Отвязать ветку'
                        : 'Скрыть'
                      : '+ Сделать веткой другого события'}
                  </button>
                </div>

                {isBranchSectionOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-purple-500/10">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-neutral-300">
                        Родительское событие
                      </label>
                      <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="">-- Выберите родительское событие --</option>
                        {allEvents
                          .filter((ev) => ev.id !== event.id)
                          .map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              [{ev.date}] {ev.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-neutral-300">
                        Название ветки / сюжетной линии
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Например: Ветка восстания, Альтернативный исход"
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row: Title & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-medium text-neutral-300">
                    Название события <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Например: Война за шахту"
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00e676]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-medium text-neutral-300">
                    Дата события
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00e676]"
                  />
                </div>
              </div>

              {/* Row: Category & Season & Important */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-medium text-neutral-300">
                      Категория
                    </label>
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: EVENT_CATEGORIES[type].badgeBg,
                        color: EVENT_CATEGORIES[type].color,
                      }}
                    >
                      {React.createElement(EVENT_CATEGORIES[type].icon, { className: 'w-3 h-3' })}
                      <span>{EVENT_CATEGORIES[type].label}</span>
                    </span>
                  </div>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as EventType)}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00e676] cursor-pointer"
                  >
                    {(Object.keys(EVENT_CATEGORIES) as EventType[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {EVENT_CATEGORIES[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-medium text-neutral-300">
                    Номер сезона
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00e676]"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={important}
                      onChange={(e) => setImportant(e.target.checked)}
                      className="rounded text-[#ffd700] focus:ring-0 focus:ring-offset-0 bg-[#1e1e1e] border-white/20 w-4 h-4"
                    />
                    <span className="font-semibold text-neutral-200 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-[#ffd700] text-[#ffd700]" />
                      <span>Важная веха</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block font-medium text-neutral-300">
                  Описание хроники
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опишите, что произошло..."
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#00e676] leading-relaxed resize-y"
                />
              </div>

              {/* Coordinates Section */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-neutral-200 text-xs">
                      Minecraft-координаты локации
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableCoords(!enableCoords)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      enableCoords
                        ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676]'
                        : 'bg-white/5 border-white/10 text-neutral-400'
                    }`}
                  >
                    {enableCoords ? 'Включено' : 'Указать координаты'}
                  </button>
                </div>

                {enableCoords && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-neutral-400">X</label>
                        <input
                          type="number"
                          value={coordX}
                          onChange={(e) => setCoordX(e.target.value)}
                          placeholder="-1240"
                          className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400">Y</label>
                        <input
                          type="number"
                          value={coordY}
                          onChange={(e) => setCoordY(e.target.value)}
                          placeholder="64"
                          className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400">Z</label>
                        <input
                          type="number"
                          value={coordZ}
                          onChange={(e) => setCoordZ(e.target.value)}
                          placeholder="320"
                          className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Измерение</label>
                      <select
                        value={coordDimension}
                        onChange={(e) => setCoordDimension(e.target.value as any)}
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="overworld">Верхний мир (Overworld)</option>
                        <option value="nether">Незер (Nether)</option>
                        <option value="the_end">Энд (The End)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Players Section with PlayerSelector */}
              <PlayerSelector
                selectedPlayers={playersList}
                onChange={setPlayersList}
                availablePlayers={availablePlayers}
                onAddNewPlayerToDb={onAddNewPlayerToDb}
                onOpenPlayerManager={onOpenPlayerManager}
              />

              {/* Optional Link */}
              <div className="space-y-1">
                <label className="block font-medium text-neutral-300">
                  Ссылка «Подробнее» (URL, необязательно)
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00e676]"
                />
              </div>

              {/* Screenshot Uploader */}
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                onShowToast={onShowToast}
              />
            </form>
          ) : (
            /* Live Preview */
            <div className="space-y-3 py-2">
              <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#00e676]" />
                <span>Предпросмотр обновлённой карточки:</span>
              </div>
              <div className="p-4 rounded-xl bg-[#141414] border border-white/15 relative">
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                  style={{ backgroundColor: EVENT_CATEGORIES[type].color }}
                />
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: EVENT_CATEGORIES[type].badgeBg,
                        color: EVENT_CATEGORIES[type].color,
                      }}
                    >
                      {React.createElement(EVENT_CATEGORIES[type].icon, { className: 'w-3.5 h-3.5' })}
                    </div>
                    <span className="text-xs text-neutral-400">{date}</span>
                    {important && (
                      <span className="inline-flex items-center gap-0.5 text-[#ffd700] text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: EVENT_CATEGORIES[type].badgeBg,
                      color: EVENT_CATEGORIES[type].badgeText,
                    }}
                  >
                    {EVENT_CATEGORIES[type].label}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-2">
                  {title || 'Заголовок события'}
                </h4>
                {description && (
                  <p className="text-xs text-neutral-300 leading-relaxed mb-3">
                    {description}
                  </p>
                )}
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-white/10 max-h-48 my-2">
                    <img
                      src={imageUrl}
                      alt="Превью"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {enableCoords && coordX && coordZ && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mb-2 font-mono">
                    <MapPin className="w-3 h-3" />
                    <span>
                      X: {coordX}, {coordY ? `Y: ${coordY}, ` : ''}Z: {coordZ}
                      {coordDimension !== 'overworld' && ` (${coordDimension === 'nether' ? 'Незер' : 'Энд'})`}
                    </span>
                  </div>
                )}
                {playersList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {playersList.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/10"
                      >
                        <img
                          src={`https://mc-heads.net/avatar/${p}/16`}
                          alt={p}
                          className="w-3.5 h-3.5"
                        />
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-white/10 bg-[#181818]">
          <div className="flex items-center gap-2">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-red-950/80 border border-red-500/40 animate-fadeIn">
                <span className="text-[11px] text-red-200 font-medium px-1">
                  Точно удалить?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEvent(event.id);
                    onShowToast(`Событие «${event.title}» удалено`);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                >
                  Да, удалить
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-neutral-300 text-xs transition-colors"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                title="Удалить это событие из базы"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Создать копию этого события"
            >
              <CopyPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Дублировать</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white"
              title="Скопировать JSON"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00e676]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00e676] hover:bg-[#00c853] text-black shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Сохранить изменения</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
