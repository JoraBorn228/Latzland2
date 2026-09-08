import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Copy, Check } from 'lucide-react';
import { LatzEvent, EVENT_CATEGORIES } from '../types';
import { formatRussianDate } from '../utils/dateUtils';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: LatzEvent;
  onShowToast: (msg: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  event,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event.imageUrl) return null;

  const category = EVENT_CATEGORIES[event.type];
  const IconComponent = category?.icon;

  const handleCopyLink = () => {
    if (event.imageUrl) {
      navigator.clipboard.writeText(event.imageUrl);
      setCopied(true);
      onShowToast('Ссылка на изображение скопирована!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!event.imageUrl) return;
    const a = document.createElement('a');
    a.href = event.imageUrl;
    a.download = `${event.title.replace(/[\s/\\?%*:|"<>]/g, '_')}-latzland.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('Началось скачивание скриншота');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* Top bar with metadata and actions */}
      <div
        className="w-full max-w-5xl flex items-center justify-between gap-3 pb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {IconComponent && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: category.badgeBg, color: category.color }}
            >
              <IconComponent className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold truncate text-white">
              {event.title}
            </h3>
            <p className="text-xs text-neutral-400">
              {formatRussianDate(event.date)}{' '}
              {event.season && `• Сезон ${event.season}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {Boolean(event.imageUrl && !event.imageUrl.startsWith('data:')) && (
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
              title="Скопировать ссылку на изображение"
            >
              {copied ? <Check className="w-4 h-4 text-[#00e676]" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
            title="Скачать изображение"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors ml-1"
            title="Закрыть (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative max-w-5xl max-h-[82vh] overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-2xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={event.imageUrl}
          alt={event.title}
          className="max-h-[82vh] max-w-full object-contain"
        />
      </div>

      <div className="pt-2 text-center text-xs text-neutral-500">
        Нажмите в любое место вне картинки или клавишу <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">Esc</kbd> чтобы закрыть
      </div>
    </div>
  );
};
