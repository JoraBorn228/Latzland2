import React, { useEffect, useState } from 'react';
import { Calendar, Layers, Flag, Users } from 'lucide-react';
import { LatzEvent } from '../types';
import { getDaysSinceDate } from '../utils/dateUtils';

interface StatsBarProps {
  events: LatzEvent[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ events = [] }) => {
  const [days, setDays] = useState(0);

  const safeEvents = Array.isArray(events) ? events : [];

  // Sort chronologically to find earliest date
  const earliestDate = [...safeEvents]
    .map((e) => e.date)
    .sort()[0] || '2026-07-20';

  const totalDays = getDaysSinceDate(earliestDate);
  const wipeEventsCount = safeEvents.filter((e) => e.type === 'wipe').length;
  const seasonsCount = wipeEventsCount + 1;

  // Collect unique players
  const playerSet = new Set<string>();
  safeEvents.forEach((e) => {
    e.players?.forEach((p) => playerSet.add(p));
  });
  const uniquePlayersCount = playerSet.size;

  useEffect(() => {
    // Smooth counter animation
    let current = 0;
    const step = Math.ceil(totalDays / 25) || 1;
    const timer = setInterval(() => {
      current += step;
      if (current >= totalDays) {
        setDays(totalDays);
        clearInterval(timer);
      } else {
        setDays(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [totalDays]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-6">
      <div className="bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-center hover:border-white/20 transition-all group">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-neutral-400 group-hover:text-[#00e676] transition-colors">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Дней сервера</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-[#00e676] tracking-tight">
          {days}
        </div>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-center hover:border-white/20 transition-all group">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-neutral-400 group-hover:text-blue-400 transition-colors">
          <Flag className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Событий</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {events.length}
        </div>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-center hover:border-white/20 transition-all group">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-neutral-400 group-hover:text-purple-400 transition-colors">
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Сезонов</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {seasonsCount}
        </div>
      </div>

      <div className="bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-center hover:border-white/20 transition-all group">
        <div className="flex items-center justify-center gap-1.5 mb-1 text-neutral-400 group-hover:text-cyan-400 transition-colors">
          <Users className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider font-semibold">Героев хроники</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {uniquePlayersCount}
        </div>
      </div>
    </div>
  );
};
