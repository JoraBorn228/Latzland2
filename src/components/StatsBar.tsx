import React, { useEffect, useState, useRef } from 'react';
import { Calendar, Layers, Flag, Users } from 'lucide-react';
import { LatzEvent } from '../types';
import { getDaysSinceDate } from '../utils/dateUtils';

interface StatsBarProps {
  events: LatzEvent[];
}

const AnimatedNumber: React.FC<{ target: number; duration?: number }> = ({ target, duration = 1200 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
};

export const StatsBar: React.FC<StatsBarProps> = ({ events = [] }) => {
  const safeEvents = Array.isArray(events) ? events : [];

  const earliestDate = [...safeEvents]
    .map((e) => e.date)
    .sort()[0] || '2026-07-20';

  const totalDays = getDaysSinceDate(earliestDate);
  const wipeEventsCount = safeEvents.filter((e) => e.type === 'wipe').length;
  const seasonsCount = wipeEventsCount + 1;

  const playerSet = new Set<string>();
  safeEvents.forEach((e) => {
    e.players?.forEach((p) => playerSet.add(p));
  });
  const uniquePlayersCount = playerSet.size;

  const stats = [
    {
      icon: Calendar,
      label: 'Дней сервера',
      value: totalDays,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
      border: 'border-emerald-500/20',
      glow: 'hover:shadow-emerald-500/10',
      topLine: 'via-emerald-500/50',
      hoverText: 'group-hover:text-emerald-300',
    },
    {
      icon: Flag,
      label: 'Событий',
      value: safeEvents.length,
      color: 'text-blue-400',
      bg: 'bg-blue-500/8',
      border: 'border-blue-500/20',
      glow: 'hover:shadow-blue-500/10',
      topLine: 'via-blue-500/50',
      hoverText: 'group-hover:text-blue-300',
    },
    {
      icon: Layers,
      label: 'Сезонов',
      value: seasonsCount,
      color: 'text-violet-400',
      bg: 'bg-violet-500/8',
      border: 'border-violet-500/20',
      glow: 'hover:shadow-violet-500/10',
      topLine: 'via-violet-500/50',
      hoverText: 'group-hover:text-violet-300',
    },
    {
      icon: Users,
      label: 'Героев хроники',
      value: uniquePlayersCount,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/8',
      border: 'border-cyan-500/20',
      glow: 'hover:shadow-cyan-500/10',
      topLine: 'via-cyan-500/50',
      hoverText: 'group-hover:text-cyan-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`group relative overflow-hidden basalt-card ${s.bg} border ${s.border} rounded-2xl p-3 sm:p-4 text-center transition-all duration-250 hover:scale-[1.02] hover:shadow-xl ${s.glow} cursor-default`}
        >
          {/* Top accent line */}
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${s.topLine} to-transparent`} />

          <div className={`flex items-center justify-center gap-1.5 mb-1.5 text-neutral-400 ${s.hoverText} transition-colors duration-200`}>
            <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
            <span className="text-[11px] uppercase tracking-wider font-semibold">{s.label}</span>
          </div>

          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${s.color}`}>
            <AnimatedNumber target={s.value} />
          </div>
        </div>
      ))}
    </div>
  );
};
