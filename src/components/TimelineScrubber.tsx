import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, ChevronUp, ChevronDown, Layers, Navigation } from 'lucide-react';
import { LatzEvent } from '../types';

interface TimelineScrubberProps {
  events: LatzEvent[];
  onJumpToEvent: (eventId: string) => void;
  onJumpToTop: () => void;
  onJumpToBottom: () => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  events,
  onJumpToEvent,
  onJumpToTop,
  onJumpToBottom,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Group events by year-month and season for quick anchor points
  const periodAnchors = useMemo(() => {
    const anchors: {
      key: string;
      label: string;
      season?: number;
      firstEventId: string;
      count: number;
    }[] = [];

    const monthNames = [
      'Янв',
      'Фев',
      'Мар',
      'Апр',
      'Май',
      'Июн',
      'Июл',
      'Авг',
      'Сен',
      'Окт',
      'Ноя',
      'Дек',
    ];

    events.forEach((evt) => {
      const dateParts = evt.date.split('-');
      const year = dateParts[0] || '2026';
      const monthIdx = parseInt(dateParts[1] || '1', 10) - 1;
      const key = `${year}-${dateParts[1] || '01'}`;
      const monthLabel = `${monthNames[monthIdx] || ''} ${year}`;

      const existing = anchors.find((a) => a.key === key);
      if (existing) {
        existing.count += 1;
      } else {
        anchors.push({
          key,
          label: monthLabel,
          season: evt.season,
          firstEventId: evt.id,
          count: 1,
        });
      }
    });

    return anchors;
  }, [events]);

  if (events.length <= 2) return null;

  return (
    <div
      id="floating-timeline-scrubber"
      className="hidden md:flex fixed right-4 bottom-6 z-30 flex-col items-center gap-2 animate-in fade-in"
    >
      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={onJumpToTop}
          className="w-10 h-10 rounded-xl bg-[#141414]/90 hover:bg-[#202020] border border-white/10 hover:border-[#00e676]/50 text-neutral-400 hover:text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 group"
          title="Наверх страницы"
        >
          <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Period Quick Anchors Popup / Menu */}
      {periodAnchors.length > 1 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xl backdrop-blur-md transition-all ${
              isMenuOpen
                ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676]'
                : 'bg-[#141414]/90 hover:bg-[#202020] border-white/10 text-neutral-300 hover:text-white'
            }`}
            title="Быстрая навигация по месяцам и сезонам"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-12 bottom-0 w-44 bg-[#141414] border border-white/15 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex flex-col gap-1 max-h-64 overflow-y-auto z-40 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-white/10">
                Переход по датам
              </div>
              {periodAnchors.map((anchor) => (
                <button
                  key={anchor.key}
                  type="button"
                  onClick={() => {
                    onJumpToEvent(anchor.firstEventId);
                    setIsMenuOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-left transition-colors group flex items-center justify-between gap-2"
                  title={`Перейти к ${anchor.label} (${anchor.count} событий)`}
                >
                  <span className="text-[11px] font-bold text-neutral-300 group-hover:text-[#00e676] transition-colors whitespace-nowrap">
                    {anchor.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 group-hover:bg-[#00e676]/20 text-neutral-400 group-hover:text-[#00e676] font-mono transition-colors">
                    {anchor.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scroll to Bottom */}
      <button
        type="button"
        onClick={onJumpToBottom}
        className="w-10 h-10 rounded-xl bg-[#141414]/90 hover:bg-[#202020] border border-white/10 hover:border-[#00e676]/50 text-neutral-400 hover:text-white flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 group"
        title="В конец ленты"
      >
        <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};
