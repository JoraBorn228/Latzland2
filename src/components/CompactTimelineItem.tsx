import React, { useState } from 'react';
import {
  Star,
  MapPin,
  GitBranch,
  Pencil,
  Trash2,
  ChevronDown,
  Copy,
  Check,
  Globe,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { LatzEvent, EVENT_CATEGORIES } from '../types';
import { formatRussianDate } from '../utils/dateUtils';
import { getMinecraftHeadUrl } from '../utils/playerUtils';

interface CompactTimelineItemProps {
  event: LatzEvent;
  isAdmin?: boolean;
  onEdit?: (event: LatzEvent) => void;
  onDelete?: (id: string) => void;
  onToggleImportant?: (id: string) => void;
  onShowToast: (msg: string) => void;
  onSelectPlayer?: (nick: string) => void;
  onOpenDiscordExport?: (event: LatzEvent) => void;
  onOpenWorldMap?: () => void;
  onOpenNetherCalc?: () => void;
  onSelectBranch?: (branch: string) => void;
}

export const CompactTimelineItem: React.FC<CompactTimelineItemProps> = ({
  event,
  isAdmin = false,
  onEdit,
  onDelete,
  onToggleImportant,
  onShowToast,
  onSelectPlayer,
  onOpenDiscordExport,
  onOpenWorldMap,
  onOpenNetherCalc,
  onSelectBranch,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const category = EVENT_CATEGORIES[event.type] || {
    label: event.type,
    color: '#00e676',
    badgeBg: 'rgba(0, 230, 118, 0.12)',
    badgeText: '#00e676',
  };

  const copyCoordinates = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.coordinates) return;
    const { x, y, z, dimension } = event.coordinates;
    const dimLabel = dimension === 'nether' ? ' (Незер)' : dimension === 'the_end' ? ' (Энд)' : '';
    navigator.clipboard.writeText(`${x} ${y !== undefined ? y : 64} ${z}`);
    setCopiedCoords(true);
    onShowToast(`Координаты скопированы: X: ${x}, Y: ${y ?? 64}, Z: ${z}${dimLabel}`);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div
      id={`event-${event.id}`}
      className="bg-[#141414] hover:bg-[#181818] border border-white/10 hover:border-white/20 rounded-xl transition-all mb-2 overflow-hidden group shadow-sm"
    >
      {/* Compact Main Row */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        className="flex items-center justify-between gap-3 p-2.5 sm:p-3 cursor-pointer select-none"
      >
        {/* Left: Date, Category badge, Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Category Color Dot */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{
              backgroundColor: category.color,
              boxShadow: `0 0 8px ${category.color}`,
            }}
          />

          {/* Date */}
          <span className="text-[11px] font-mono text-neutral-400 shrink-0">
            {formatRussianDate(event.date)}
          </span>

          {/* Category Badge */}
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 hidden sm:inline-block"
            style={{
              backgroundColor: category.badgeBg,
              color: category.badgeText,
            }}
          >
            {category.label}
          </span>

          {/* Title */}
          <span className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
            {event.title}
          </span>

          {/* Important Star */}
          {event.important && (
            <Star className="w-3 h-3 text-[#ffd700] fill-current shrink-0" />
          )}

          {/* Season badge */}
          {event.season && (
            <span className="text-[10px] text-neutral-500 font-mono px-1 py-0.2 rounded bg-white/5 shrink-0 hidden md:inline">
              С{event.season}
            </span>
          )}

          {/* Branch badge */}
          {event.branchName && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectBranch) onSelectBranch(event.branchName!);
              }}
              className="text-[10px] text-purple-300 bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.2 rounded-full shrink-0 hidden lg:inline-flex items-center gap-1 hover:bg-purple-500/25"
            >
              <GitBranch className="w-2.5 h-2.5" />
              <span>{event.branchName}</span>
            </span>
          )}
        </div>

        {/* Right: Players Mini Avatars, Coordinates Chip & Expand Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Coordinates Quick Pill */}
          {event.coordinates && (
            <button
              type="button"
              onClick={copyCoordinates}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-[10px] font-mono text-neutral-300 hover:text-emerald-300 transition-all"
              title="Нажмите, чтобы скопировать координаты"
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>
                {event.coordinates.x}, {event.coordinates.z}
              </span>
              {copiedCoords ? (
                <Check className="w-2.5 h-2.5 text-emerald-400" />
              ) : (
                <Copy className="w-2.5 h-2.5 text-neutral-500" />
              )}
            </button>
          )}

          {/* Players Mini Avatars */}
          {event.players && event.players.length > 0 && (
            <div className="flex items-center -space-x-1.5">
              {event.players.slice(0, 3).map((player) => (
                <img
                  key={player}
                  src={getMinecraftHeadUrl(player, 18)}
                  alt={player}
                  title={`Участник: ${player}`}
                  className="w-4 h-4 rounded-full border border-[#141414] image-render-pixelated"
                />
              ))}
              {event.players.length > 3 && (
                <span className="text-[9px] font-bold text-neutral-400 pl-1">
                  +{event.players.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Admin quick tools */}
          {isAdmin && (
            <div
              className="flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(event)}
                  className="p-1 text-emerald-400 hover:bg-emerald-500/15 rounded"
                  title="Редактировать"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="p-1 text-red-400 hover:bg-red-500/15 rounded"
                  title="Удалить"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Chevron */}
          <ChevronDown
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180 text-white' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded Quick Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 bg-black/20 text-xs text-neutral-300 animate-in fade-in">
          {event.description && (
            <p className="mb-2.5 text-neutral-300 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5 text-[11px]">
            {event.coordinates && (
              <button
                type="button"
                onClick={copyCoordinates}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-300 font-mono"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>
                  X: {event.coordinates.x}, Y: {event.coordinates.y ?? 64}, Z:{' '}
                  {event.coordinates.z}
                </span>
              </button>
            )}

            {event.players && event.players.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-neutral-500">Участники:</span>
                {event.players.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onSelectPlayer && onSelectPlayer(p)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 font-medium"
                  >
                    <img
                      src={getMinecraftHeadUrl(p, 16)}
                      alt={p}
                      className="w-3.5 h-3.5 rounded image-render-pixelated"
                    />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            )}

            {event.link && (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Ссылка</span>
              </a>
            )}

            {onOpenDiscordExport && (
              <button
                type="button"
                onClick={() => onOpenDiscordExport(event)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300"
              >
                <Share2 className="w-3 h-3" />
                <span>Discord</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
