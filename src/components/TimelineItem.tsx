import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ExternalLink,
  MapPin,
  Star,
  Copy,
  Check,
  Share2,
  Pencil,
  Trash2,
  Maximize2,
  Pin,
  GitBranch,
  GitFork,
  CornerDownRight,
  X,
  Globe,
  MessageSquare,
} from 'lucide-react';
import { LatzEvent, EVENT_CATEGORIES } from '../types';
import { formatRussianDate } from '../utils/dateUtils';
import { ImageLightboxModal } from './ImageLightboxModal';
import { PlayerAvatar } from './PlayerAvatar';

interface TimelineItemProps {
  event: LatzEvent;
  isInitiallyOpen?: boolean;
  isAdmin?: boolean;
  onEdit?: (event: LatzEvent) => void;
  onDelete?: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  onShowToast: (msg: string) => void;
  onFilterByPlayer?: (username: string) => void;
  onOpenPlayerProfile?: (username: string) => void;
  onCreateBranch?: (parentEvent: LatzEvent) => void;
  onShareDiscord?: (event: LatzEvent) => void;
  parentEvent?: LatzEvent;
  childBranches?: LatzEvent[];
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  event,
  isInitiallyOpen = false,
  isAdmin = false,
  onEdit,
  onDelete,
  onToggleImportant,
  onShowToast,
  onFilterByPlayer,
  onOpenPlayerProfile,
  onCreateBranch,
  onShareDiscord,
  parentEvent,
  childBranches = [],
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Sync when initial open changes (e.g. Expand All / Collapse All)
  useEffect(() => {
    setIsOpen(isInitiallyOpen);
  }, [isInitiallyOpen]);

  const category = EVENT_CATEGORIES[event.type] || {
    label: event.type,
    icon: Pin,
    color: '#00e676',
    badgeBg: 'rgba(0, 230, 118, 0.12)',
    badgeText: '#00e676',
    markerBorder: '#00e676',
    markerShadow: 'rgba(0, 230, 118, 0.4)',
    cardStripe: 'bg-[#00e676]',
  };

  const CategoryIcon = category.icon;

  const hasDescription = Boolean(event.description && event.description.trim());
  const hasCoordinates = Boolean(event.coordinates);
  const hasPlayers = Boolean(event.players && event.players.length > 0);
  const hasLink = Boolean(event.link && event.link.trim());
  const hasImage = Boolean(event.imageUrl && event.imageUrl.trim());
  const hasDetails = hasDescription || hasCoordinates || hasPlayers || hasLink || hasImage;

  const copyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.coordinates) return;
    const { x, y, z, dimension } = event.coordinates;
    const coordText = y !== undefined ? `X: ${x}, Y: ${y}, Z: ${z}` : `X: ${x}, Z: ${z}`;
    const dimLabel = dimension === 'nether' ? ' (Незер)' : dimension === 'the_end' ? ' (Энд)' : '';
    navigator.clipboard.writeText(`${x} ${y !== undefined ? y : 64} ${z}`);
    setCopiedCoords(true);
    onShowToast(`Координаты скопированы: ${coordText}${dimLabel}`);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const copyEventShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `[${formatRussianDate(event.date)}] ${event.title} - ${event.description || ''}`;
    navigator.clipboard.writeText(shareText);
    onShowToast('Запись скопирована!');
  };

  const handleToggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative pl-11 sm:pl-14 mb-4 group" id={`event-${event.id}`}>
      {/* Node marker on vertical timeline - 3D Cyber Sphere */}
      <div
        className="absolute left-[12px] sm:left-[16px] top-5 w-4 h-4 rounded-full border border-white/50 transition-all duration-300 group-hover:scale-125 z-10 cursor-pointer"
        style={{
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${category.color} 45%, #05070a 100%)`,
          boxShadow: `0 0 10px ${category.color}, 0 0 20px ${category.markerShadow}, inset 0 0 3px rgba(255,255,255,0.8)`,
        }}
        onClick={handleToggleOpen}
        title={`${category.label}: ${event.title}`}
      />
      {/* Subtle pulsing aura ring */}
      <div
        className="absolute left-[8px] sm:left-[12px] top-4 w-6 h-6 rounded-full opacity-60 pointer-events-none group-hover:opacity-100 transition-opacity"
        style={{
          border: `1.5px solid ${category.color}60`,
          boxShadow: `0 0 12px ${category.color}40`,
          animation: 'spherePulse 3.5s ease-in-out infinite',
          ['--node-color' as string]: category.color,
        }}
      />
      {/* Horizontal connector from the vertical lightguide to the card */}
      <div
        className="absolute left-[28px] sm:left-[32px] top-[27px] w-[16px] sm:w-[24px] h-[1.5px] pointer-events-none transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, ${category.color}90, transparent)`,
          boxShadow: `0 0 6px ${category.color}40`,
        }}
      />

      {/* Main Event Card (Cyber Basalt) */}
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-300 basalt-card border ${
          isOpen
            ? 'border-white/25 shadow-2xl bg-[#0f131a]'
            : 'border-white/10 hover:border-white/20 bg-[#0b0e14] hover:bg-[#0e1117]'
        }`}
        style={{
          boxShadow: isOpen
            ? `0 12px 36px rgba(0,0,0,0.6), 0 0 0 1px ${category.color}35`
            : undefined,
        }}
      >
        {/* Semi-transparent background art/screenshot vignette banner */}
        {hasImage && (
          <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-25 group-hover:opacity-35 transition-opacity duration-300">
            <img
              src={event.imageUrl}
              alt=""
              className="w-full h-full object-cover object-center filter blur-[1px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0e14]/85 to-[#0b0e14]" />
          </div>
        )}

        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-75"
          style={{
            background: `linear-gradient(90deg, ${category.color}99, ${category.color}33, transparent 80%)`,
          }}
        />

        {/* Left vertical colored accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            backgroundColor: category.color,
            boxShadow: `0 0 8px ${category.color}66`,
          }}
        />

        {/* Card Header (clickable to collapse/expand) */}
        <div
          onClick={handleToggleOpen}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleOpen();
            }
          }}
          className="relative flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 pl-4 sm:pl-5 select-none cursor-pointer focus:outline-none focus:bg-white/[0.04]"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            {/* Category Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/15 transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: category.badgeBg,
                color: category.color,
                boxShadow: `0 0 12px ${category.color}25`,
              }}
            >
              <CategoryIcon className="w-4 h-4" />
            </div>

            {/* Title & Date */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5 flex-wrap">
                <span className="font-mono text-[11px] text-neutral-300 font-medium">
                  {formatRussianDate(event.date)}
                </span>
                {event.important && (
                  <span
                    className="inline-flex items-center gap-1 text-[#ffd700] text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30"
                    title="Важная веха"
                  >
                    <Star className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Важное</span>
                  </span>
                )}
                {event.season && (
                  <span className="text-[10px] text-emerald-400/90 font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/25">
                    С{event.season}
                  </span>
                )}
                {event.parentId && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300"
                    title={parentEvent ? `Ответвление от: ${parentEvent.title}` : 'Ответвление'}
                  >
                    <GitBranch className="w-2.5 h-2.5" />
                    <span>Ветка{event.branchName ? `: ${event.branchName}` : ''}</span>
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug break-words">
                {event.title}
              </h3>
            </div>
          </div>

          {/* Right badges & controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 pt-0.5 sm:pt-0">
            {/* Floating 3D-styled heads of key participants in header */}
            {hasPlayers && (
              <div
                className="hidden sm:flex items-center -space-x-1.5 shrink-0 px-2 py-1 rounded-full bg-black/40 border border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                {event.players!.slice(0, 3).map((player) => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => {
                      if (onOpenPlayerProfile) onOpenPlayerProfile(player);
                      else if (onFilterByPlayer) onFilterByPlayer(player);
                    }}
                    className="relative rounded-full border border-black/80 hover:z-10 hover:scale-110 transition-transform cursor-pointer"
                    title={`Участник: ${player}`}
                  >
                    <PlayerAvatar username={player} size={20} className="rounded-full shadow-sm" />
                  </button>
                ))}
                {event.players!.length > 3 && (
                  <span
                    className="relative z-0 pl-2 pr-1 text-[10px] font-mono text-neutral-400 font-bold"
                    title={`Всего ${event.players!.length} участников`}
                  >
                    +{event.players!.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Admin quick action buttons */}
            {isAdmin && (
              <div
                className="flex items-center gap-1 bg-black/50 border border-amber-500/30 rounded-lg p-0.5 mr-1"
                onClick={(e) => e.stopPropagation()}
              >
                {onToggleImportant && (
                  <button
                    type="button"
                    onClick={() => onToggleImportant(event.id)}
                    className={`p-1 rounded hover:bg-white/10 transition-colors ${
                      event.important ? 'text-[#ffd700]' : 'text-neutral-500 hover:text-white'
                    }`}
                    title={event.important ? 'Снять отметку важного' : 'Сделать важным'}
                  >
                    <Star className={`w-3.5 h-3.5 ${event.important ? 'fill-current' : ''}`} />
                  </button>
                )}

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 rounded transition-colors"
                    title="Редактировать событие"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}

                {onDelete && (
                  isConfirmingDelete ? (
                    <div
                      className="flex items-center gap-1 bg-red-950/90 border border-red-500/50 rounded-lg px-2 py-0.5 animate-fadeIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-red-200 font-medium whitespace-nowrap">
                        Удалить?
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(event.id);
                          onShowToast(`Событие «${event.title}» удалено`);
                          setIsConfirmingDelete(false);
                        }}
                        className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
                      >
                        Да
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsConfirmingDelete(false);
                        }}
                        className="p-0.5 rounded text-neutral-400 hover:text-white transition-colors"
                        title="Отмена"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsConfirmingDelete(true);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/15 rounded transition-colors"
                      title="Удалить событие"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>
            )}

            {/* Category tag */}
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border whitespace-nowrap"
              style={{
                backgroundColor: category.badgeBg,
                color: category.color,
                borderColor: `${category.color}40`,
                boxShadow: `0 0 8px ${category.color}20`,
              }}
            >
              {category.label}
            </span>

            {/* Chevron toggle button */}
            <div
              className={`text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-transform duration-250 ${
                isOpen ? 'rotate-180 text-white' : ''
              }`}
              title={isOpen ? 'Свернуть карточку' : 'Развернуть карточку'}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Collapsible Accordion Content with CSS Grid transition */}
        <div
          className={`accordion-wrapper ${isOpen ? 'is-open' : 'is-closed'}`}
          style={{
            display: 'grid',
            gridTemplateRows: isOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="accordion-content">
            <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-white/5 space-y-3.5">
              {/* Parent Branch Info */}
              {parentEvent && (
                <div className="flex items-center flex-wrap gap-2 text-xs p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200">
                  <div className="flex items-center gap-1.5 font-medium shrink-0">
                    <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ответвление от:</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const el = document.getElementById(`event-${parentEvent.id}`);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('ring-2', 'ring-purple-400');
                        setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400'), 2500);
                      }
                    }}
                    className="font-bold text-white underline hover:text-purple-300 transition-colors text-left"
                  >
                    «{parentEvent.title}»
                  </button>
                  {event.branchName && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-medium">
                      Ветка: {event.branchName}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {hasDescription ? (
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pt-1">
                  {event.description}
                </p>
              ) : (
                <p className="text-xs text-neutral-500 italic pt-1">
                  Подробное описание пока не добавлено.
                  {isAdmin && ' (Нажмите ✏️ выше, чтобы добавить детали)'}
                </p>
              )}

              {/* Child Branches if any */}
              {childBranches.length > 0 && (
                <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold">
                    <GitFork className="w-3.5 h-3.5 text-purple-400" />
                    <span>От этого события отходят ветки ({childBranches.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {childBranches.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const el = document.getElementById(`event-${child.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('ring-2', 'ring-purple-400');
                            setTimeout(() => el.classList.remove('ring-2', 'ring-purple-400'), 2500);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-xs text-purple-200 hover:text-white transition-all group/branch"
                      >
                        <CornerDownRight className="w-3 h-3 text-purple-400 group-hover/branch:translate-x-0.5 transition-transform" />
                        <span className="font-medium">{child.title}</span>
                        {child.branchName && (
                          <span className="text-[10px] text-purple-300/70">
                            • {child.branchName}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image preview if present */}
              {hasImage && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="relative group/img rounded-xl overflow-hidden border border-white/10 max-h-72 mt-2 bg-black/40 cursor-pointer"
                >
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
                    <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-lg">
                      <Maximize2 className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Нажмите для увеличения</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coordinates and Players bar */}
              {(hasCoordinates || hasPlayers) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Coordinates chip (Pure vanilla coordinates, no /tp) */}
                  {event.coordinates && (
                    <div className="inline-flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={copyCoordinates}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 transition-all hover:border-emerald-500/40 group"
                        title="Координаты точки. Нажмите, чтобы скопировать"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] text-neutral-200">
                          X: {event.coordinates.x},{' '}
                          {event.coordinates.y !== undefined &&
                            `Y: ${event.coordinates.y}, `}
                          Z: {event.coordinates.z}
                        </span>
                        {event.coordinates.dimension && event.coordinates.dimension !== 'overworld' && (
                          <span className={`text-[10px] px-1 py-0.2 rounded font-semibold ${
                            event.coordinates.dimension === 'nether'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {event.coordinates.dimension === 'nether' ? 'Незер' : 'Энд'}
                          </span>
                        )}
                        {copiedCoords ? (
                          <Check className="w-3 h-3 text-[#00e676]" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-500 group-hover:text-white" />
                        )}
                      </button>

                      {/* Direct BlueMap Link */}
                      <a
                        href={`http://map.latzland.eu:29476/#${
                          event.coordinates.dimension === 'nether'
                            ? 'world_nether'
                            : event.coordinates.dimension === 'the_end'
                            ? 'world_the_end'
                            : 'world'
                        }:${event.coordinates.x}:${event.coordinates.y ?? 70}:${event.coordinates.z}:50:1.61:0.78:0:0:perspective`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 hover:text-white transition-all"
                        title="Открыть эту локацию в онлайн-карте BlueMap"
                      >
                        <Globe className="w-3 h-3 text-emerald-400" />
                        <span>BlueMap</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Players list with heads and profile modal trigger */}
                  {hasPlayers && (
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="text-[11px] text-neutral-500 font-medium">
                        Участники:
                      </span>
                      {event.players?.map((player) => (
                        <button
                          key={player}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPlayerProfile) {
                              onOpenPlayerProfile(player);
                            } else if (onFilterByPlayer) {
                              onFilterByPlayer(player);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer group/pl"
                          title={`Открыть паспорт игрока ${player}`}
                        >
                          <PlayerAvatar username={player} size={16} />
                          <span>{player}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom bar: link & quick actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/5 text-xs">
                {hasLink ? (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#00e676] hover:underline font-medium"
                  >
                    <span>Подробнее</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div />
                )}

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Create branch action */}
                  {onCreateBranch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateBranch(event);
                      }}
                      className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 px-2 py-1 rounded transition-colors text-[11px] font-medium"
                      title="Создать ответвление от этого события"
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>Ветка</span>
                    </button>
                  )}

                  {isAdmin && onEdit && (
                    <button
                      onClick={() => onEdit(event)}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors text-[11px] font-medium"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Изменить</span>
                    </button>
                  )}

                  {onShareDiscord && (
                    <button
                      onClick={() => onShareDiscord(event)}
                      className="inline-flex items-center gap-1 text-[#5865F2] hover:text-[#7983f5] transition-colors text-[11px] font-medium"
                      title="Экспорт красивого поста для Discord"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discord</span>
                    </button>
                  )}

                  <button
                    onClick={copyEventShare}
                    className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors"
                    title="Скопировать описание события"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Поделиться</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {hasImage && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          event={event}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
