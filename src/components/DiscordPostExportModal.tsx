import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Share2,
  Calendar,
  MapPin,
  Users,
  Globe,
} from 'lucide-react';
import { LatzEvent, EVENT_CATEGORIES } from '../types';
import { formatRussianDate } from '../utils/dateUtils';

interface DiscordPostExportModalProps {
  event: LatzEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DiscordPostExportModal: React.FC<DiscordPostExportModalProps> = ({
  event,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [includeBlueMap, setIncludeBlueMap] = useState(true);
  const [includeSpoilers, setIncludeSpoilers] = useState(false);
  const [includePlayers, setIncludePlayers] = useState(true);
  const [includeIp, setIncludeIp] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const category = EVENT_CATEGORIES[event.type] || EVENT_CATEGORIES.event;

  // Generate BlueMap URL
  const blueMapUrl = event.coordinates
    ? `http://map.latzland.eu:29476/#${
        event.coordinates.dimension === 'nether'
          ? 'world_nether'
          : event.coordinates.dimension === 'the_end'
          ? 'world_the_end'
          : 'world'
      }:${event.coordinates.x}:${event.coordinates.y ?? 70}:${event.coordinates.z}:50:1.61:0.78:0:0:perspective`
    : null;

  // Construct Discord Markdown
  const buildDiscordPost = () => {
    const lines: string[] = [];

    // Header title
    lines.push(`## 🏛️ **${event.title}**`);
    lines.push(`> 📅 **Дата:** ${formatRussianDate(event.date)}${event.season ? ` • *Сезон ${event.season}*` : ''}`);
    lines.push(`> 🏷️ **Категория:** ${category.label}`);

    if (event.description) {
      lines.push('');
      lines.push(event.description);
    }

    if (includePlayers && event.players && event.players.length > 0) {
      lines.push('');
      lines.push(`👥 **Участники:** ${event.players.map((p) => `\`${p}\``).join(', ')}`);
    }

    if (event.coordinates) {
      const dimName =
        event.coordinates.dimension === 'nether'
          ? 'Незер'
          : event.coordinates.dimension === 'the_end'
          ? 'Энд'
          : 'Верхний мир';
      const coordStr = `X: ${event.coordinates.x}, ${event.coordinates.y !== undefined ? `Y: ${event.coordinates.y}, ` : ''}Z: ${event.coordinates.z} (${dimName})`;
      
      lines.push('');
      if (includeSpoilers) {
        lines.push(`📍 **Координаты:** ||\`${coordStr}\`||`);
      } else {
        lines.push(`📍 **Координаты:** \`${coordStr}\``);
      }
    }

    if (includeBlueMap && blueMapUrl) {
      lines.push(`🗺️ **Онлайн-карта:** <${blueMapUrl}>`);
    }

    if (includeIp) {
      lines.push('');
      lines.push(`🎮 **Сервер LatzLand SMP:** \`play.latzland.eu\` *(26.2)*`);
    }

    return lines.join('\n');
  };

  const discordText = buildDiscordPost();

  const handleCopy = () => {
    navigator.clipboard.writeText(discordText);
    setCopied(true);
    onShowToast('Текст для Discord скопирован!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl flex flex-col bg-[#121212] border border-white/15 rounded-2xl shadow-2xl overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#181818] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2] shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Экспорт для Discord
              </h3>
              <p className="text-xs text-neutral-400">
                Форматированный пост для каналов анонсов и новостей
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-4 border-b border-white/10 bg-[#141414] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeBlueMap}
              onChange={(e) => setIncludeBlueMap(e.target.checked)}
              className="accent-[#5865F2] rounded"
            />
            <span>Ссылка BlueMap</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeSpoilers}
              onChange={(e) => setIncludeSpoilers(e.target.checked)}
              className="accent-[#5865F2] rounded"
            />
            <span>Спойлер || ||</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includePlayers}
              onChange={(e) => setIncludePlayers(e.target.checked)}
              className="accent-[#5865F2] rounded"
            />
            <span>Игроки</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={includeIp}
              onChange={(e) => setIncludeIp(e.target.checked)}
              className="accent-[#5865F2] rounded"
            />
            <span>IP сервера</span>
          </label>
        </div>

        {/* Discord Preview Box */}
        <div className="p-5 overflow-y-auto max-h-[50vh] bg-[#313338] text-[#dbdee1] font-sans text-xs sm:text-sm leading-relaxed space-y-2 select-text border-y border-white/5">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10 text-xs text-neutral-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#5865F2]" />
            <span>Превью сообщения в Discord</span>
          </div>

          <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-200 bg-[#2b2d31] p-3 rounded-xl border border-white/5 overflow-x-auto">
            {discordText}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#181818] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
          >
            Закрыть
          </button>

          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center gap-2 shadow-lg shadow-[#5865F2]/25 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Скопировано!' : 'Скопировать для Discord'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
