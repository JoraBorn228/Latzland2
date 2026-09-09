import React, { useState } from 'react';
import {
  Shield,
  Swords,
  Home,
  MessageSquare,
  Pickaxe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Star,
  Scroll,
  Users,
  Zap,
  Globe,
  Lock,
  ArrowLeft,
} from 'lucide-react';

interface RulesPageProps {
  onGoToHome: () => void;
  onGoToTimeline: () => void;
}

interface Rule {
  id: string;
  text: string;
  type: 'required' | 'forbidden' | 'info';
}

interface RuleSection {
  id: string;
  icon: React.ElementType;
  title: string;
  color: string;
  bg: string;
  border: string;
  accent: string;
  description: string;
  rules: Rule[];
}

const RULE_SECTIONS: RuleSection[] = [
  {
    id: 'general',
    icon: Shield,
    title: 'Общие правила',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/20',
    accent: '#00e676',
    description: 'Базовые нормы поведения, которые распространяются на всех игроков сервера.',
    rules: [
      { id: 'g1', text: 'Уважай других игроков — оскорбления, дискриминация и травля недопустимы.', type: 'required' },
      { id: 'g2', text: 'Любые споры решаются в переписке или через администрацию, не в игре.', type: 'info' },
      { id: 'g3', text: 'Запрещено использовать личные данные других игроков без их согласия.', type: 'forbidden' },
      { id: 'g4', text: 'Запрещён спам и рассылка рекламы в чате и личных сообщениях.', type: 'forbidden' },
      { id: 'g5', text: 'Решения администрации окончательны. Оспаривать можно только в Discord.', type: 'info' },
    ],
  },
  {
    id: 'pvp',
    icon: Swords,
    title: 'PvP и конфликты',
    color: 'text-rose-400',
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/20',
    accent: '#f43f5e',
    description: 'Правила боевых столкновений, объявления войн и взаимодействия между игроками.',
    rules: [
      { id: 'p1', text: 'PvP разрешён только с взаимного согласия или в рамках официально объявленной войны.', type: 'required' },
      { id: 'p2', text: 'Для объявления войны необходимо предупредить противника минимум за 24 часа.', type: 'required' },
      { id: 'p3', text: 'Убийство новичков (до 3 дней на сервере) строго запрещено.', type: 'forbidden' },
      { id: 'p4', text: 'Запрещено использование ловушек смерти на территории общего доступа (спавн, хабы).', type: 'forbidden' },
      { id: 'p5', text: 'После окончания войны нападавшая сторона обязана вернуть захваченные предметы.', type: 'info' },
      { id: 'p6', text: 'Griefing допускается только на территории объявленного врага в рамках войны.', type: 'info' },
    ],
  },
  {
    id: 'builds',
    icon: Home,
    title: 'Постройки и территория',
    color: 'text-violet-400',
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/20',
    accent: '#a855f7',
    description: 'Правила строительства, захвата земли и работы с чужой собственностью.',
    rules: [
      { id: 'b1', text: 'Строиться ближе 200 блоков от чужой базы без разрешения запрещено.', type: 'forbidden' },
      { id: 'b2', text: 'Гриферство (уничтожение построек) вне войны карается баном.', type: 'forbidden' },
      { id: 'b3', text: 'Территория считается занятой, если на ней есть постройки или знак с ником владельца.', type: 'info' },
      { id: 'b4', text: 'Спавн и центральный хаб — нейтральная зона, строить там запрещено.', type: 'forbidden' },
      { id: 'b5', text: 'Лагозависящие фермы и редстоун-конструкции требуют одобрения администрации.', type: 'required' },
      { id: 'b6', text: 'Брошенные базы (нет активности 30+ дней) могут быть переданы другим игрокам.', type: 'info' },
    ],
  },
  {
    id: 'chat',
    icon: MessageSquare,
    title: 'Чат и общение',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/8',
    border: 'border-cyan-500/20',
    accent: '#06b6d4',
    description: 'Нормы поведения в игровом чате, Discord и других каналах коммуникации.',
    rules: [
      { id: 'c1', text: 'Мат допускается умеренно и только не в направлении конкретных игроков.', type: 'info' },
      { id: 'c2', text: 'Запрещены расистские, сексистские и дискриминирующие высказывания.', type: 'forbidden' },
      { id: 'c3', text: 'Не флудить — не более 3 одинаковых сообщений подряд.', type: 'required' },
      { id: 'c4', text: 'Реклама сторонних серверов или сайтов без разрешения запрещена.', type: 'forbidden' },
      { id: 'c5', text: 'В тематических каналах Discord писать строго по теме.', type: 'required' },
    ],
  },
  {
    id: 'cheats',
    icon: Pickaxe,
    title: 'Моды и читы',
    color: 'text-amber-400',
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/20',
    accent: '#f59e0b',
    description: 'Что разрешено использовать, а что даёт нечестное преимущество и запрещено.',
    rules: [
      { id: 'ch1', text: 'Разрешены: миникарты без отображения игроков, оптимизационные моды, Optifine/Sodium.', type: 'required' },
      { id: 'ch2', text: 'Запрещены: X-Ray, автокликеры, летательные читы, Speed Hack, Kill Aura.', type: 'forbidden' },
      { id: 'ch3', text: 'Дюп предметов любым способом — немедленный бан без предупреждения.', type: 'forbidden' },
      { id: 'ch4', text: 'Использование багов игры для получения преимущества запрещено. О багах нужно сообщать.', type: 'forbidden' },
      { id: 'ch5', text: 'Разрешены: Replay Mod, координатные HUD-моды, моды улучшения интерфейса.', type: 'required' },
    ],
  },
  {
    id: 'economy',
    icon: Zap,
    title: 'Торговля и ресурсы',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/8',
    border: 'border-yellow-500/20',
    accent: '#eab308',
    description: 'Правила внутрисерверной торговли, обмена ресурсами и использования чужого имущества.',
    rules: [
      { id: 'e1', text: 'Мошенничество при торговле (несправедливый обмен, невыполнение сделки) запрещено.', type: 'forbidden' },
      { id: 'e2', text: 'Воровство с чужих баз, складов и ферм запрещено вне военного времени.', type: 'forbidden' },
      { id: 'e3', text: 'Использование чужих ферм и механизмов разрешено только с согласия владельца.', type: 'required' },
      { id: 'e4', text: 'Общественные фермы (на спавне) доступны всем игрокам бесплатно.', type: 'info' },
    ],
  },
  {
    id: 'admin',
    icon: Lock,
    title: 'Администрация',
    color: 'text-neutral-400',
    bg: 'bg-white/4',
    border: 'border-white/10',
    accent: '#737373',
    description: 'Правила взаимодействия с администрацией и порядок подачи жалоб.',
    rules: [
      { id: 'a1', text: 'Администраторы не обязаны объяснять все свои решения публично.', type: 'info' },
      { id: 'a2', text: 'Жалобы на игроков подавать только через Discord, с доказательствами (скрины, видео).', type: 'required' },
      { id: 'a3', text: 'Запрещено выдавать себя за администратора или вводить игроков в заблуждение насчёт прав.', type: 'forbidden' },
      { id: 'a4', text: 'Правила могут обновляться. Все изменения публикуются в Discord за 48 часов до вступления.', type: 'info' },
      { id: 'a5', text: 'Незнание правил не освобождает от ответственности.', type: 'info' },
    ],
  },
];

const PUNISHMENTS = [
  { level: 1, label: 'Предупреждение', desc: 'Первичное нарушение правил чата или мелкие нарушения.', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { level: 2, label: 'Мут 1–24ч', desc: 'Повторные нарушения чата, флуд, грубость к игрокам.', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { level: 3, label: 'Кик', desc: 'Нарушение правил поведения, мешающее другим игрокам.', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { level: 4, label: 'Временный бан', desc: 'Серьёзные нарушения: PvP без согласия, кража, гриф.', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { level: 5, label: 'Перманентный бан', desc: 'Читы, дюп, системный гриф, ксенофобия, угрозы.', color: 'text-red-500', bg: 'bg-red-500/12', border: 'border-red-500/30' },
];

export const RulesPage: React.FC<RulesPageProps> = ({ onGoToHome, onGoToTimeline }) => {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['general']));

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAll = () => setOpenSections(new Set(RULE_SECTIONS.map((s) => s.id)));
  const closeAll = () => setOpenSections(new Set());

  const ruleIcon = (type: Rule['type']) => {
    if (type === 'required') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
    if (type === 'forbidden') return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#e8e8e8] overflow-x-hidden">
      <style>{`
        @keyframes rules-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rules-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes rules-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rules-accordion {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rules-title {
          background: linear-gradient(90deg, #ffffff 0%, #00e676 40%, #ffffff 60%, #a7f3d0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rules-shimmer 5s linear infinite;
        }
        .rules-hero-1 { animation: rules-slide-up 0.7s 0s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .rules-hero-2 { animation: rules-slide-up 0.7s 0.1s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .rules-hero-3 { animation: rules-slide-up 0.7s 0.2s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .rules-hero-4 { animation: rules-slide-up 0.7s 0.3s cubic-bezier(0.16,1,0.3,1) forwards; opacity: 0; }
        .rules-accordion-content { animation: rules-accordion 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
        .rule-card { transition: all 0.22s cubic-bezier(0.16,1,0.3,1); }
        .rule-card:hover { transform: translateY(-2px); }
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none" style={{ animation: 'rules-glow 6s ease-in-out infinite' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-violet-500/6 blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[200px] h-[200px] rounded-full bg-emerald-500/4 blur-[80px]" />
        </div>
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,230,118,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,118,0.6) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-10 sm:pt-16 sm:pb-12">
          {/* Breadcrumb */}
          <div className="rules-hero-1 flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={onGoToHome}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Главная
            </button>
            <span className="text-neutral-700">/</span>
            <span className="text-xs text-neutral-400 font-medium">Правила</span>
          </div>

          {/* Badge */}
          <div className="rules-hero-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-[11px] text-violet-400 font-semibold tracking-wider uppercase mb-5">
            <Shield className="w-3 h-3" />
            Правила сервера
          </div>

          {/* Title */}
          <h1 className="rules-hero-3 text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
            <span className="rules-title">Правила</span>
            <br />
            <span className="text-neutral-400 font-light text-2xl sm:text-3xl tracking-widest uppercase">LatzLand</span>
          </h1>

          {/* Description */}
          <p className="rules-hero-4 text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed mb-8">
            Прочитай внимательно перед тем, как начать играть. Все правила обязательны к соблюдению
            для каждого участника сервера. Незнание правил{' '}
            <span className="text-rose-400 font-medium">не освобождает от ответственности</span>.
          </p>

          {/* Legend chips */}
          <div className="rules-hero-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Обязательно / разрешено</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Запрещено</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Важная информация</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK STATS ─── */}
      <section className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Shield, label: 'Разделов правил', value: RULE_SECTIONS.length, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
            { icon: XCircle, label: 'Запрещено', value: RULE_SECTIONS.flatMap(s => s.rules).filter(r => r.type === 'forbidden').length, color: 'text-rose-400', bg: 'bg-rose-500/8', border: 'border-rose-500/20' },
            { icon: CheckCircle, label: 'Обязательно', value: RULE_SECTIONS.flatMap(s => s.rules).filter(r => r.type === 'required').length, color: 'text-emerald-400', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
            { icon: AlertTriangle, label: 'К сведению', value: RULE_SECTIONS.flatMap(s => s.rules).filter(r => r.type === 'info').length, color: 'text-amber-400', bg: 'bg-amber-500/8', border: 'border-amber-500/20' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border ${stat.border} rounded-xl p-3 sm:p-4 text-center`}>
              <div className={`flex items-center justify-center gap-1.5 mb-1.5 text-neutral-500 text-[11px] uppercase tracking-wider font-semibold`}>
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="hidden sm:inline">{stat.label}</span>
              </div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-neutral-600 sm:hidden mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RULES SECTIONS ─── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        {/* Expand/Collapse controls */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Все правила</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAll}
              className="text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/8"
            >
              Развернуть все
            </button>
            <span className="text-neutral-700">·</span>
            <button
              type="button"
              onClick={closeAll}
              className="text-xs text-neutral-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/8"
            >
              Свернуть все
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {RULE_SECTIONS.map((section) => {
            const isOpen = openSections.has(section.id);
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className={`rule-card rounded-2xl border overflow-hidden ${section.border} ${section.bg}`}
                style={{
                  boxShadow: isOpen ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${section.accent}15` : undefined,
                }}
              >
                {/* Top accent line */}
                <div
                  className="h-[2px]"
                  style={{ background: `linear-gradient(90deg, ${section.accent}80, ${section.accent}20, transparent)` }}
                />

                {/* Section header — clickable */}
                <button
                  type="button"
                  className="w-full flex items-center gap-4 px-5 py-4 text-left focus:outline-none"
                  onClick={() => toggleSection(section.id)}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${section.accent}18`, border: `1px solid ${section.accent}30` }}
                  >
                    <Icon className={`w-5 h-5 ${section.color}`} />
                  </div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-bold text-white text-sm sm:text-base">{section.title}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed line-clamp-1">
                      {section.description}
                    </div>
                  </div>

                  {/* Count badge + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${section.color}`}
                      style={{ background: `${section.accent}15` }}
                    >
                      {section.rules.length} пр.
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Accordion content */}
                {isOpen && (
                  <div className="rules-accordion-content px-5 pb-5">
                    {/* Section description (full) */}
                    <p className="text-xs text-neutral-400 leading-relaxed mb-4 border-t border-white/5 pt-4">
                      {section.description}
                    </p>

                    <div className="space-y-2">
                      {section.rules.map((rule, idx) => (
                        <div
                          key={rule.id}
                          className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <span className="text-[11px] font-mono text-neutral-600 shrink-0 mt-0.5 w-5 text-right">
                            {idx + 1}.
                          </span>
                          {ruleIcon(rule.type)}
                          <p className="text-sm text-neutral-300 leading-relaxed">{rule.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── PUNISHMENT TABLE ─── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, #131313 0%, #111111 100%)' }}
        >
          {/* Header */}
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Система наказаний</h2>
                <p className="text-xs text-neutral-500">Уровни санкций за нарушение правил</p>
              </div>
            </div>
          </div>

          {/* Punishment levels */}
          <div className="p-4 space-y-2">
            {PUNISHMENTS.map((p) => (
              <div
                key={p.level}
                className={`flex items-center gap-4 p-3.5 rounded-xl ${p.bg} border ${p.border}`}
              >
                <div className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-neutral-500">{p.level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-bold ${p.color}`}>{p.label}</div>
                  <div className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="relative max-w-4xl mx-auto px-4 pb-16 text-center">
        <div
          className="relative overflow-hidden rounded-2xl px-6 py-10"
          style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.05) 0%, rgba(0,0,0,0) 60%)', border: '1px solid rgba(0,230,118,0.12)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,230,118,0.4), transparent)' }} />
          <Star className="w-8 h-8 text-emerald-400/50 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Принял правила? Вперёд!</h2>
          <p className="text-sm text-neutral-400 mb-7 max-w-sm mx-auto">
            Подключайся к серверу, изучай хронологию событий и создавай историю вместе с нами
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGoToTimeline}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.04]"
              style={{
                background: 'rgba(0,230,118,0.12)',
                border: '1px solid rgba(0,230,118,0.35)',
                color: '#6ee7b7',
                boxShadow: '0 0 20px rgba(0,230,118,0.1)',
              }}
            >
              <Scroll className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Открыть хронологию
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onGoToHome}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Home className="w-4 h-4" />
              На главную
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
