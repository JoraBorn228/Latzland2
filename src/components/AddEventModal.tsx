import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Copy,
  Check,
  Code,
  MapPin,
  Users,
  Sparkles,
  Eye,
  Info,
  Star,
  GitBranch,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { EventType, EVENT_CATEGORIES, LatzEvent, PlayerProfile } from '../types';
import { ImageUploader } from './ImageUploader';
import { PlayerSelector } from './PlayerSelector';
import { sanitizeText, sanitizeUrl, validateCoordinates } from '../utils/sanitizer';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  initialAuthorNick?: string;
  onAddEvent: (newEvent: LatzEvent) => void;
  onSubmitEventProposal?: (proposal: {
    eventData: LatzEvent;
    submittedBy: string;
    userComment?: string;
  }) => void;
  onShowToast: (msg: string) => void;
  availablePlayers: PlayerProfile[];
  onAddNewPlayerToDb: (newPlayer: PlayerProfile) => void;
  onOpenPlayerManager: () => void;
  allEvents: LatzEvent[];
  initialParentEvent?: LatzEvent | null;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  initialAuthorNick = '',
  onAddEvent,
  onSubmitEventProposal,
  onShowToast,
  availablePlayers,
  onAddNewPlayerToDb,
  onOpenPlayerManager,
  allEvents = [],
  initialParentEvent = null,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [type, setType] = useState<EventType>('event');
  const [important, setImportant] = useState(false);
  const [season, setSeason] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitterNick, setSubmitterNick] = useState('');
  const [submitterComment, setSubmitterComment] = useState('');

  // Branching
  const [parentId, setParentId] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [isBranchSectionOpen, setIsBranchSectionOpen] = useState(false);

  // Sync initial parent event & author if passed
  useEffect(() => {
    if (initialParentEvent) {
      setParentId(initialParentEvent.id);
      setIsBranchSectionOpen(true);
      if (initialParentEvent.season) setSeason(initialParentEvent.season);
      if (initialParentEvent.date) setDate(initialParentEvent.date);
    } else {
      setParentId('');
      setBranchName('');
      setIsBranchSectionOpen(false);
    }

    if (initialAuthorNick && !isAdmin) {
      setSubmitterNick((prev) => prev || initialAuthorNick);
    }
  }, [initialParentEvent, initialAuthorNick, isAdmin, isOpen]);

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

  if (!isOpen) return null;

  const selectedParentEvent = allEvents.find((e) => e.id === parentId);

  const buildEventObject = (): LatzEvent => {
    const author = sanitizeText(submitterNick.trim()) || sanitizeText(initialAuthorNick) || 'Игрок';
    const effectivePlayers = playersList.length > 0 
      ? playersList.map(p => sanitizeText(p)).filter(Boolean) 
      : (!isAdmin && author !== 'Игрок' ? [author] : undefined);

    const validCoords = enableCoords ? validateCoordinates(coordX, coordY, coordZ) : null;

    const newEvent: LatzEvent = {
      id: `ev-${Date.now()}`,
      date: date || todayStr,
      title: sanitizeText(title) || 'Новое событие',
      type,
      important,
      season: Math.max(1, Math.min(20, Number(season) || 1)),
      description: sanitizeText(description) || undefined,
      link: sanitizeUrl(link) || undefined,
      imageUrl: sanitizeUrl(imageUrl) || undefined,
      players: effectivePlayers,
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
    return newEvent;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      onShowToast('Пожалуйста, введите название события');
      return;
    }
    const ev = buildEventObject();
    const finalAuthor = submitterNick.trim() || initialAuthorNick || 'Игрок';

    if (isAdmin) {
      onAddEvent(ev);
      onShowToast(`Событие «${ev.title}» опубликовано в истории!`);
    } else {
      onSubmitEventProposal?.({
        eventData: ev,
        submittedBy: finalAuthor,
        userComment: submitterComment.trim() || undefined,
      });
      onShowToast(`Событие «${ev.title}» отправлено в предложку! Статус можно отслеживать в Кабинете.`);
    }

    onClose();
  };

  const handleCopyJson = () => {
    const ev = buildEventObject();
    const jsonStr = JSON.stringify(ev, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedCode(true);
    onShowToast('JSON события скопирован в буфер обмена!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyTsCode = () => {
    const ev = buildEventObject();
    const code = `  {
    date: "${ev.date}",
    title: "${ev.title.replace(/"/g, '\\"')}",
    description: "${(ev.description || '').replace(/"/g, '\\"')}",
    type: "${ev.type}",
    important: ${Boolean(ev.important)},
    season: ${ev.season || 1},${
      ev.players?.length
        ? `\n    players: [${ev.players.map((p) => `"${p}"`).join(', ')}],`
        : ''
    }${
      ev.coordinates
        ? `\n    coordinates: { x: ${ev.coordinates.x}, y: ${ev.coordinates.y ?? 64}, z: ${ev.coordinates.z} },`
        : ''
    }
    link: "${ev.link || ''}"
  },`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onShowToast('Код для events.ts скопирован в буфер обмена!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#181818]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#00e676]/15 text-[#00e676] flex items-center justify-center border border-[#00e676]/30">
              {isAdmin ? <Plus className="w-4 h-4 stroke-[2.5]" /> : <Send className="w-4 h-4 stroke-[2.5]" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>{isAdmin ? 'Добавить событие в хронологию' : 'Предложить событие в хронологию'}</span>
                {isAdmin ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Админ
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    Предложка
                  </span>
                )}
              </h2>
              <p className="text-xs text-neutral-400">
                {isAdmin
                  ? 'Событие будет мгновенно опубликовано в общем таймлайне'
                  : 'Заявка отправится в предложку и появится после проверки администратором'}
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
            Форма события
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              showPreview
                ? 'border-[#00e676] text-[#00e676]'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Предпросмотр</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {!isAdmin && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">Режим предложки для игроков: </span>
                <span>Вы можете свободно предложить любое событие. Администратор проверит его и добавит на сервер.</span>
              </div>
            </div>
          )}

          {!showPreview ? (
            <form id="add-event-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Название события <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Открытие первого алмазного банка"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1f1f1f] border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#00e676] transition-colors"
                />
              </div>

              {/* Submitter info when player mode */}
              {!isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Ваш никнейм в игре <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Fr0gus"
                      value={submitterNick}
                      onChange={(e) => setSubmitterNick(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121212] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Комментарий для администратора
                    </label>
                    <input
                      type="text"
                      placeholder="Любые пояснения..."
                      value={submitterComment}
                      onChange={(e) => setSubmitterComment(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#121212] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Date, Season & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Дата события
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e676]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Сезон
                  </label>
                  <select
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e676]"
                  >
                    <option value={1}>Сезон 1 (2026 — Текущий)</option>
                    <option value={2}>Сезон 2 (Будущий)</option>
                    <option value={3}>Сезон 3 (Будущий)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Категория
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as EventType)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#00e676]"
                  >
                    {Object.entries(EVENT_CATEGORIES).map(([catKey, cat]) => (
                      <option key={catKey} value={catKey}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Описание и подробности
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишите, что произошло, кто участвовал, какие были последствия..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1f1f1f] border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00e676]"
                />
              </div>

              {/* Players Tagging Component */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Участники события (Minecraft ники)
                </label>
                <PlayerSelector
                  selectedPlayers={playersList}
                  onChange={setPlayersList}
                  availablePlayers={availablePlayers}
                  onAddNewPlayerToDb={onAddNewPlayerToDb}
                  onOpenPlayerManager={onOpenPlayerManager}
                />
              </div>

              {/* Image Uploader */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Скриншот или иллюстрация
                </label>
                <ImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  onShowToast={onShowToast}
                />
              </div>

              {/* Coordinates block */}
              <div className="p-3 bg-[#1a1a1a] border border-white/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableCoords}
                      onChange={(e) => setEnableCoords(e.target.checked)}
                      className="rounded bg-[#222] border-white/20 text-[#00e676] focus:ring-0"
                    />
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Указать координаты в мире</span>
                  </label>
                  {enableCoords && (
                    <span className="text-[10px] text-neutral-500 font-mono">F3 координаты</span>
                  )}
                </div>

                {enableCoords && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in">
                    <div>
                      <input
                        type="number"
                        placeholder="X (напр. 120)"
                        value={coordX}
                        onChange={(e) => setCoordX(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-[#00e676]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Y (напр. 64)"
                        value={coordY}
                        onChange={(e) => setCoordY(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-[#00e676]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Z (напр. -450)"
                        value={coordZ}
                        onChange={(e) => setCoordZ(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-[#00e676]"
                      />
                    </div>
                    <div>
                      <select
                        value={coordDimension}
                        onChange={(e) => setCoordDimension(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-[#00e676]"
                      >
                        <option value="overworld">Верхний мир</option>
                        <option value="nether">Незер</option>
                        <option value="the_end">Энд</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Branching */}
              <div className="p-3 bg-[#1a1a1a] border border-white/5 rounded-xl space-y-2">
                <button
                  type="button"
                  onClick={() => setIsBranchSectionOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-medium text-neutral-300 hover:text-white"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                    <span>Связать в ветку / сюжетную линию</span>
                  </div>
                  <span className="text-[10px] text-purple-400">
                    {parentId ? 'Связано' : isBranchSectionOpen ? 'Скрыть' : 'Настроить'}
                  </span>
                </button>

                {isBranchSectionOpen && (
                  <div className="pt-2 space-y-2 border-t border-white/5 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        Родительское событие (причина / предыстория)
                      </label>
                      <select
                        value={parentId}
                        onChange={(e) => setParentId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="">-- Без родительского события (автономное) --</option>
                        {allEvents.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            [{ev.date}] {ev.title} (Сезон {ev.season || 1})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-neutral-400 mb-1">
                        Название сюжетной линии / ветки
                      </label>
                      <input
                        type="text"
                        placeholder="Например: Великая торговая война, Суд над гриферами..."
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#141414] border border-white/10 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Extra check */}
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={important}
                    onChange={(e) => setImportant(e.target.checked)}
                    className="rounded bg-[#222] border-white/20 text-yellow-400 focus:ring-0"
                  />
                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Ключевое историческое событие (золотой маркер)</span>
                </label>
              </div>
            </form>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: EVENT_CATEGORIES[type].badgeBg,
                      color: EVENT_CATEGORIES[type].badgeText,
                    }}
                  >
                    {EVENT_CATEGORIES[type].label}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{date}</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {title || 'Без названия'}
                </h3>
                {description && (
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
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
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Скопировать как чистый JSON"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-[#00e676]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>Скопировать JSON</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTsCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Скопировать готовый фрагмент кода для events.ts"
            >
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>Код для events.ts</span>
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
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00e676] hover:bg-[#00c853] text-black shadow-[0_0_12px_rgba(0,230,118,0.25)] transition-all"
            >
              {isAdmin ? <Plus className="w-4 h-4 stroke-[2.5]" /> : <Send className="w-4 h-4 stroke-[2.5]" />}
              <span>{isAdmin ? 'Опубликовать событие' : 'Отправить в предложку'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
