import React, { useEffect, useRef, useState } from 'react';
import {
  Pickaxe,
  Scroll,
  Users,
  Trophy,
  Map,
  Star,
  ChevronRight,
  Swords,
  Hammer,
  Globe,
  Zap,
  BookOpen,
  Shield,
  Clock,
  ArrowDown,
  Sparkles,
  FileText,
} from 'lucide-react';

interface HomePageProps {
  onGoToTimeline: () => void;
  onGoToRules?: () => void;
  eventsCount: number;
  playersCount: number;
  projectsCount: number;
  serverIp?: string;
  isOnline?: boolean;
  onlinePlayers?: number;
}

const FloatingParticle: React.FC<{
  style: React.CSSProperties;
  delay: number;
}> = ({ style, delay }) => (
  <div
    className="absolute rounded-full bg-emerald-400 pointer-events-none"
    style={{
      ...style,
      animation: `floatParticle ${3 + delay}s ${delay}s ease-in-out infinite alternate`,
    }}
  />
);

const CountUp: React.FC<{ target: number; duration?: number }> = ({ target, duration = 1800 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) return;
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

  return <span ref={ref}>{count > 0 ? count : target > 0 ? '—' : '0'}</span>;
};

export const HomePage: React.FC<HomePageProps> = ({
  onGoToTimeline,
  onGoToRules,
  eventsCount,
  playersCount,
  projectsCount,
  serverIp = 'play.latzland.eu',
  isOnline = false,
  onlinePlayers = 0,
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (bgRef.current) {
        const scrolled = window.scrollY;
        bgRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const particles = Array.from({ length: 22 }, (_, i) => ({
    style: {
      width: `${1.5 + (i % 4)}px`,
      height: `${1.5 + (i % 4)}px`,
      left: `${(i * 4.5 + 3) % 100}%`,
      top: `${(i * 11 + 5) % 100}%`,
      opacity: 0.15 + (i % 5) * 0.07,
    } as React.CSSProperties,
    delay: (i % 6) * 0.5,
    key: i,
  }));

  const features = [
    {
      cls: 'hp-feat-1',
      icon: Scroll,
      title: 'Хронология событий',
      desc: 'Все ключевые моменты истории сервера — войны, союзы, открытия, постройки и победы. Фильтруй по типу, сезону или ищи конкретное событие.',
      ic: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
      br: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10',
      badge: 'Главное',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
    {
      cls: 'hp-feat-2',
      icon: Trophy,
      title: 'Зал Славы',
      desc: 'Рейтинги самых активных игроков, уникальные звания, рекорды и достижения. Кто вписал своё имя в историю LatzLand?',
      ic: 'text-amber-400',
      bg: 'bg-amber-500/8',
      br: 'border-amber-500/20',
      glow: 'shadow-amber-500/10',
      badge: 'Рейтинги',
      badgeColor: 'bg-amber-500/20 text-amber-300',
    },
    {
      cls: 'hp-feat-3',
      icon: Map,
      title: 'Интерактивная карта',
      desc: 'Координаты баз, построек, спавна и порталов в Незер. 2D-карта с удобным поиском и 3D-режимом через внешнюю карту.',
      ic: 'text-blue-400',
      bg: 'bg-blue-500/8',
      br: 'border-blue-500/20',
      glow: 'shadow-blue-500/10',
      badge: 'Навигация',
      badgeColor: 'bg-blue-500/20 text-blue-300',
    },
    {
      cls: 'hp-feat-4',
      icon: Hammer,
      title: 'Каталог строек',
      desc: 'Мегапроекты и совместные инициативы: от первой хижины до грандиозных инфраструктурных проектов. С описанием, датами и авторами.',
      ic: 'text-violet-400',
      bg: 'bg-violet-500/8',
      br: 'border-violet-500/20',
      glow: 'shadow-violet-500/10',
      badge: 'Постройки',
      badgeColor: 'bg-violet-500/20 text-violet-300',
    },
    {
      cls: 'hp-feat-5',
      icon: Users,
      title: 'База игроков',
      desc: 'Профили всех участников сервера — биографии, скины, вклад в историю, статистика и социальные связи.',
      ic: 'text-cyan-400',
      bg: 'bg-cyan-500/8',
      br: 'border-cyan-500/20',
      glow: 'shadow-cyan-500/10',
      badge: 'Сообщество',
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      action: undefined as (() => void) | undefined,
    },
    {
      cls: 'hp-feat-6',
      icon: Shield,
      title: 'Предложения игроков',
      desc: 'Система пользовательских заявок: добавляй события самостоятельно, отправляй на модерацию и следи за статусом.',
      ic: 'text-rose-400',
      bg: 'bg-rose-500/8',
      br: 'border-rose-500/20',
      glow: 'shadow-rose-500/10',
      badge: 'Участие',
      badgeColor: 'bg-rose-500/20 text-rose-300',
      action: undefined as (() => void) | undefined,
    },
    {
      cls: 'hp-feat-7',
      icon: FileText,
      title: 'Правила сервера',
      desc: 'Полный свод правил LatzLand — PvP, постройки, торговля, чат, читы и система наказаний.',
      ic: 'text-violet-400',
      bg: 'bg-violet-500/8',
      br: 'border-violet-500/20',
      glow: 'shadow-violet-500/10',
      badge: 'Правила',
      badgeColor: 'bg-violet-500/20 text-violet-300',
      action: onGoToRules,
    },
  ];

  const timeline_highlights = [
    { icon: Swords, label: 'Войны и конфликты', color: 'text-red-400' },
    { icon: Hammer, label: 'Великие постройки', color: 'text-violet-400' },
    { icon: Users, label: 'Альянсы и союзы', color: 'text-cyan-400' },
    { icon: Zap, label: 'Ивенты и рейды', color: 'text-yellow-400' },
    { icon: Globe, label: 'Открытия миров', color: 'text-blue-400' },
    { icon: Star, label: 'Ключевые победы', color: 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#e8e8e8] overflow-x-hidden">
      <style>{`
        @keyframes floatParticle {
          from { opacity: 0.08; transform: translateY(0px) scale(1); }
          to { opacity: 0.45; transform: translateY(-24px) scale(1.6); }
        }
        @keyframes heroGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(0,230,118,0.30); box-shadow: 0 0 0 0 rgba(0,230,118,0); }
          50% { border-color: rgba(0,230,118,0.75); box-shadow: 0 0 30px 0 rgba(0,230,118,0.18); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fadeInSection {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hp-hero-title { animation: slideUpFade 0.85s 0s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-hero-sub { animation: slideUpFade 0.85s 0.15s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-hero-desc { animation: slideUpFade 0.85s 0.28s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-hero-cta { animation: slideUpFade 0.85s 0.42s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-hero-tags { animation: slideUpFade 0.85s 0.56s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-stat-1 { animation: slideUpFade 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-stat-2 { animation: slideUpFade 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-stat-3 { animation: slideUpFade 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-1 { animation: slideUpFade 0.6s 0.05s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-2 { animation: slideUpFade 0.6s 0.12s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-3 { animation: slideUpFade 0.6s 0.19s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-4 { animation: slideUpFade 0.6s 0.26s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-5 { animation: slideUpFade 0.6s 0.33s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .hp-feat-6 { animation: slideUpFade 0.6s 0.40s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }

        .glow-btn { animation: pulse-border 3s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #00e676 0%, #ffffff 35%, #00e676 55%, #a7f3d0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4.5s linear infinite;
        }
        .cta-main-btn {
          background: linear-gradient(135deg, rgba(0,230,118,0.15) 0%, rgba(0,230,118,0.08) 100%);
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .cta-main-btn:hover {
          background: linear-gradient(135deg, rgba(0,230,118,0.28) 0%, rgba(0,230,118,0.15) 100%);
          transform: scale(1.04) translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,230,118,0.15), 0 0 0 1px rgba(0,230,118,0.5);
        }
        .cta-main-btn:active { transform: scale(0.98); }
        .feature-card {
          transition: all 0.28s cubic-bezier(0.16,1,0.3,1);
        }
        .feature-card:hover {
          transform: translateY(-3px) scale(1.012);
        }
        .stat-card {
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .stat-card:hover {
          transform: translateY(-4px) scale(1.03);
        }
        .bounce-icon {
          animation: bounce-subtle 2.5s ease-in-out infinite;
        }
        .scanline-effect {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,230,118,0.3), transparent);
          animation: scanline 5s linear infinite;
          pointer-events: none;
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(0,230,118,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,230,118,0.04) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .about-section {
          background: linear-gradient(180deg, transparent 0%, rgba(0,230,118,0.03) 50%, transparent 100%);
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════ HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Ambient glow orbs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ animation: 'heroGlow 7s ease-in-out infinite' }}
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/5 blur-[130px]" />
          <div className="absolute top-1/3 left-1/5 w-[320px] h-[320px] rounded-full bg-emerald-400/3 blur-[90px]" />
          <div className="absolute bottom-1/4 right-1/5 w-[280px] h-[280px] rounded-full bg-cyan-500/4 blur-[100px]" />
          <div className="absolute top-2/3 left-2/3 w-[200px] h-[200px] rounded-full bg-violet-500/3 blur-[70px]" />
        </div>

        {/* Grid background */}
        <div className="absolute inset-0 grid-bg pointer-events-none opacity-100" />

        {/* Scanline */}
        <div className="scanline-effect" />

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" ref={bgRef}>
          {particles.map((p) => (
            <FloatingParticle key={p.key} style={p.style} delay={p.delay} />
          ))}
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto" ref={heroRef}>
          {/* Server pill */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs text-neutral-400 mb-10 backdrop-blur-md">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
            <span className="font-mono tracking-wide">{serverIp}</span>
            {isOnline && onlinePlayers > 0 && (
              <>
                <span className="w-px h-3 bg-white/15" />
                <span className="text-emerald-400 font-semibold">{onlinePlayers} онлайн</span>
              </>
            )}
            {!isOnline && <span className="text-neutral-600">офлайн</span>}
          </div>

          {/* Icon + Title */}
          <div className="hp-hero-title">
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="relative w-16 h-16 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Pickaxe className="w-8 h-8 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                </div>
              </div>
            </div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none mb-2">
              <span className="shimmer-text">LatzLand</span>
            </h1>
            <p className="text-lg sm:text-2xl font-light text-neutral-400 tracking-[0.2em] uppercase mt-3 mb-0">
              История сервера
            </p>
          </div>

          {/* Divider */}
          <div className="hp-hero-sub flex items-center justify-center gap-4 my-7">
            <div className="h-px flex-1 max-w-24 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <BookOpen className="w-4 h-4 text-emerald-500/50" />
            <div className="h-px flex-1 max-w-24 bg-gradient-to-l from-transparent to-emerald-500/30" />
          </div>

          {/* Description */}
          <p className="hp-hero-desc text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Добро пожаловать в живую летопись{' '}
            <span className="text-emerald-400 font-medium">LatzLand SMP</span> —
            Minecraft-сервера с богатой историей. Здесь хранятся все ключевые события: войны и союзы,
            великие постройки и рейды, внутрисерверная политика и личные истории игроков.{' '}
            <span className="text-neutral-300">Изучай хронологию, находи себя в базе игроков,
            исследуй карту мира и погружайся в легенды LatzLand.</span>
          </p>

          {/* CTA Buttons */}
          <div className="hp-hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* Primary CTA */}
            <button
              onClick={onGoToTimeline}
              id="btn-open-timeline"
              className="glow-btn cta-main-btn group flex items-center gap-3 px-8 py-4 rounded-2xl border border-emerald-500/40 text-emerald-300 font-bold text-base"
            >
              <Scroll className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="tracking-wide">Открыть хронологию</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>

            {/* Secondary CTA */}
            <a
              href="http://map.latzland.eu:29476/#world:0:70:0:50:1.61:0.78:0:0:perspective"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white font-semibold text-base transition-all duration-250 hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-white/5"
            >
              <Globe className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span>3D-Карта мира</span>
            </a>
          </div>

          {/* Tags */}
          <div className="hp-hero-tags flex flex-wrap items-center justify-center gap-2">
            {timeline_highlights.map((tag) => (
              <div
                key={tag.label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/8 text-xs text-neutral-500"
              >
                <tag.icon className={`w-3 h-3 ${tag.color}`} />
                <span>{tag.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-600 bounce-icon">
          <span className="text-[9px] uppercase tracking-[0.3em] font-medium">прокрути</span>
          <ArrowDown className="w-4 h-4" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ ABOUT */}
      <section className="about-section relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium mb-5 tracking-wider uppercase">
              <BookOpen className="w-3 h-3" />
              О сайте
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Что такое LatzLand Wiki?
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Это не просто сайт — это <span className="text-white font-medium">живая летопись</span> Minecraft-сервера,
              созданная самими игроками. Каждое событие, каждая постройка и каждый союз —
              всё это история, которую мы сохраняем вместе.
            </p>
          </div>

          {/* About cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              {
                icon: Clock,
                title: 'Живая история',
                desc: 'Хронология обновляется в реальном времени. Свежие события появляются сразу после добавления администраторами или после одобрения заявок игроков.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/8',
                border: 'border-emerald-500/20',
              },
              {
                icon: Users,
                title: 'Для игроков',
                desc: 'Любой участник сервера может предложить событие к добавлению, заполнить свой профиль, отследить свои достижения и вклад в историю LatzLand.',
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/8',
                border: 'border-cyan-500/20',
              },
              {
                icon: Shield,
                title: 'Проверено',
                desc: 'Все заявки проходят модерацию. Администраторы следят за точностью данных, добавляют доказательства и верифицируют ключевые события.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/8',
                border: 'border-violet-500/20',
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`feature-card p-6 rounded-2xl border ${card.border} ${card.bg} shadow-xl ${card.color}`}
              >
                <div className={`w-11 h-11 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center mb-4`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{card.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ STATS */}
      <section className="relative py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Цифры говорят сами</h2>
            <p className="text-neutral-500 text-sm">Масштаб истории LatzLand в числах</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="hp-stat-1 stat-card relative flex flex-col items-center text-center p-8 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 overflow-hidden shadow-xl shadow-emerald-500/5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/10">
                <Scroll className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-5xl font-black mb-2 text-emerald-400 tabular-nums">
                <CountUp target={eventsCount} />
              </div>
              <div className="text-xs text-neutral-400 font-medium tracking-wider uppercase">Событий в хронологии</div>
              <div className="mt-3 text-[10px] text-neutral-600">войны · постройки · ивенты</div>
            </div>

            <div className="hp-stat-2 stat-card relative flex flex-col items-center text-center p-8 rounded-2xl border border-cyan-500/25 bg-cyan-500/8 overflow-hidden shadow-xl shadow-cyan-500/5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/12 border border-cyan-500/30 flex items-center justify-center mb-5 shadow-lg shadow-cyan-500/10">
                <Users className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="text-5xl font-black mb-2 text-cyan-400 tabular-nums">
                <CountUp target={playersCount} />
              </div>
              <div className="text-xs text-neutral-400 font-medium tracking-wider uppercase">Игроков в базе</div>
              <div className="mt-3 text-[10px] text-neutral-600">профили · статистика · роли</div>
            </div>

            <div className="hp-stat-3 stat-card relative flex flex-col items-center text-center p-8 rounded-2xl border border-violet-500/25 bg-violet-500/8 overflow-hidden shadow-xl shadow-violet-500/5">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
              <div className="w-14 h-14 rounded-2xl bg-violet-500/12 border border-violet-500/30 flex items-center justify-center mb-5 shadow-lg shadow-violet-500/10">
                <Hammer className="w-7 h-7 text-violet-400" />
              </div>
              <div className="text-5xl font-black mb-2 text-violet-400 tabular-nums">
                <CountUp target={projectsCount} />
              </div>
              <div className="text-xs text-neutral-400 font-medium tracking-wider uppercase">Мегастроек</div>
              <div className="mt-3 text-[10px] text-neutral-600">проекты · координаты · авторы</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ FEATURES */}
      <section className="relative py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-400 font-medium mb-5 tracking-wider uppercase">
              <Zap className="w-3 h-3 text-yellow-400" />
              Возможности
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Что есть на сайте?</h2>
            <p className="text-sm text-neutral-500 max-w-lg mx-auto">
              Всё о LatzLand — в одном месте. Каждый раздел рассказывает свою часть истории сервера.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const CardEl = (f as any).action ? 'button' : 'div';
              return (
                <CardEl
                  key={f.title}
                  type={CardEl === 'button' ? 'button' : undefined}
                  onClick={(f as any).action ?? undefined}
                  className={`${f.cls} feature-card group relative flex flex-col gap-3 p-6 rounded-2xl border ${f.br} ${f.bg} shadow-lg overflow-hidden text-left ${(f as any).action ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} border ${f.br} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <f.icon className={`w-5 h-5 ${f.ic}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${f.badgeColor} tracking-wider uppercase`}>
                        {f.badge}
                      </span>
                      {(f as any).action && (
                        <ChevronRight className={`w-3.5 h-3.5 ${f.ic} opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200`} />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1.5">{f.title}</h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
                  </div>
                </CardEl>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ BOTTOM CTA */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-500/6 blur-[100px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
            <Scroll className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Готов погрузиться<br />
            <span className="shimmer-text">в историю?</span>
          </h2>

          <p className="text-sm sm:text-base text-neutral-400 mb-10 max-w-md mx-auto leading-relaxed">
            Листай события по дате, фильтруй по типу, изучай карты и находи своё место
            в хрониках сервера LatzLand.
          </p>

          <button
            onClick={onGoToTimeline}
            id="btn-open-timeline-bottom"
            className="glow-btn cta-main-btn group inline-flex items-center gap-3 px-10 py-4.5 rounded-2xl border border-emerald-500/40 text-emerald-300 font-bold text-lg"
          >
            <Scroll className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span className="tracking-wide">Открыть хронологию</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </button>

          <p className="text-xs text-neutral-600 mt-6">
            {eventsCount > 0 ? `${eventsCount} событий ждут тебя` : 'История ждёт тебя'}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ FOOTER */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Pickaxe className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-neutral-400">LatzLand</span>
            <span className="text-neutral-700">·</span>
            <span className="text-xs text-neutral-600">История сервера</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-neutral-600">{serverIp}</span>
            <span className={`flex items-center gap-1.5 text-xs ${isOnline ? 'text-emerald-500' : 'text-neutral-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-700'}`} />
              {isOnline ? `${onlinePlayers} online` : 'offline'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
