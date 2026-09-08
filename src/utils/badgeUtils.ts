import { Crown, ShieldCheck, Star, Hammer, Swords, Flame, Compass, Users, Pickaxe, Gem } from 'lucide-react';
import { LatzEvent, PlayerProfile, PlayerBadge } from '../types';

export interface StandardBadgeDefinition {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  iconComponent: any;
  color: string;
  border: string;
  bg: string;
  check: (player: PlayerProfile, events: LatzEvent[]) => boolean;
}

export const STANDARD_BADGES: StandardBadgeDefinition[] = [
  {
    id: 'founder',
    title: 'Основатель сервера',
    description: 'Стоял у истоков создания и запуска LatzLand',
    iconEmoji: '👑',
    iconComponent: Crown,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      return (
        u === 'weistel' ||
        u === 'fr0gus' ||
        Boolean(player.role?.toLowerCase().includes('основатель')) ||
        events.some((e) => e.type === 'founding' && e.players?.some((p) => p.toLowerCase() === u))
      );
    },
  },
  {
    id: 'veteran',
    title: 'Ветеран 1-го Сезона',
    description: 'Участвовал в ключевых событиях первого сезона',
    iconEmoji: '🛡️',
    iconComponent: ShieldCheck,
    color: 'text-emerald-400',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      return pEvents.some((e) => !e.season || e.season === 1);
    },
  },
  {
    id: 'chronicler',
    title: 'Герой Летописи (3+ события)',
    description: 'Упомянут в 3 и более ключевых событиях хроники',
    iconEmoji: '📜',
    iconComponent: Star,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      return pEvents.length >= 3;
    },
  },
  {
    id: 'architect',
    title: 'Главный Архитектор',
    description: 'Строитель ключевых объектов, трактов и баз',
    iconEmoji: '🏛️',
    iconComponent: Hammer,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      return (
        pEvents.some((e) => e.type === 'build') ||
        /архитект|строит/i.test(player.role || '')
      );
    },
  },
  {
    id: 'warrior',
    title: 'Ветеран Войн & Битв',
    description: 'Участник зафиксированных военных конфликтов и сражений',
    iconEmoji: '⚔️',
    iconComponent: Swords,
    color: 'text-rose-400',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      return (
        pEvents.some((e) => e.type === 'war') ||
        /воин|боец|командир|лидер «северных»|лидер «степняков»/i.test(player.role || '')
      );
    },
  },
  {
    id: 'nether_master',
    title: 'Исследователь Незера',
    description: 'Владеет базами или порталами в Нижнем мире',
    iconEmoji: '🔥',
    iconComponent: Flame,
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      const hasNetherCoords =
        typeof player.homeCoordinates === 'object' &&
        player.homeCoordinates?.dimension === 'nether';
      return (
        hasNetherCoords ||
        pEvents.some(
          (e) =>
            e.coordinates?.dimension === 'nether' ||
            e.title.toLowerCase().includes('незер') ||
            e.title.toLowerCase().includes('портал')
        )
      );
    },
  },
  {
    id: 'pioneer',
    title: 'Первопроходец',
    description: 'Один из первых исследователей спавна и диких земель',
    iconEmoji: '🧭',
    iconComponent: Compass,
    color: 'text-sky-400',
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/15',
    check: (player, events) => {
      const u = player.username.toLowerCase();
      const pEvents = events.filter((e) => e.players?.some((p) => p.toLowerCase() === u));
      return (
        u === 'fr0gus' ||
        player.role?.toLowerCase().includes('первопроходец') ||
        pEvents.some((e) => e.id === 'ev-1' || e.id === 'ev-2')
      );
    },
  },
  {
    id: 'diplomat',
    title: 'Мастер Дипломатии',
    description: 'Организатор мирных договоров, альянсов и переговоров',
    iconEmoji: '🤝',
    iconComponent: Users,
    color: 'text-teal-400',
    border: 'border-teal-500/40',
    bg: 'bg-teal-500/15',
    check: (player) => {
      return /дипломат|мэр|лидер|посол|президент/i.test(player.role || '');
    },
  },
  {
    id: 'miner',
    title: 'Стахановец Шахт',
    description: 'Добытчик ресурсов для масштабных строек и проектов',
    iconEmoji: '⛏️',
    iconComponent: Pickaxe,
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/15',
    check: (player) => {
      return /шахтер|майнер|добытчик|стахановец/i.test(player.role || '');
    },
  },
  {
    id: 'merchant',
    title: 'Гильдия Торговцев',
    description: 'Основатель торговых лавок, хабов и банков',
    iconEmoji: '💎',
    iconComponent: Gem,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/15',
    check: (player) => {
      return /торговец|банкир|купец|бизнес/i.test(player.role || '');
    },
  },
];

export interface ResolvedBadge {
  id: string;
  title: string;
  description: string;
  iconEmoji: string;
  iconComponent?: any;
  color: string;
  border: string;
  bg: string;
  isCustom: boolean;
  isManuallyAssigned?: boolean;
  grantedAt?: string;
  grantedBy?: string;
}

/**
 * Resolves all active badges for a player, including standard auto/manual badges and custom awards.
 */
export function resolvePlayerBadges(
  player: PlayerProfile,
  events: LatzEvent[]
): ResolvedBadge[] {
  const result: ResolvedBadge[] = [];

  // 1. Evaluate standard badges
  for (const std of STANDARD_BADGES) {
    const isManuallyDisabled = player.disabledBadges?.includes(std.id);
    if (isManuallyDisabled) continue;

    const isManuallyAssigned = player.assignedBadges?.includes(std.id);
    const isAutoUnlocked = std.check(player, events);

    if (isManuallyAssigned || isAutoUnlocked) {
      result.push({
        id: std.id,
        title: std.title,
        description: std.description,
        iconEmoji: std.iconEmoji,
        iconComponent: std.iconComponent,
        color: std.color,
        border: std.border,
        bg: std.bg,
        isCustom: false,
        isManuallyAssigned: Boolean(isManuallyAssigned),
      });
    }
  }

  // 2. Add custom badges granted by administration
  if (player.customBadges && Array.isArray(player.customBadges)) {
    for (const custom of player.customBadges) {
      result.push({
        id: custom.id,
        title: custom.title,
        description: custom.description || 'Особая награда от администрации сервера',
        iconEmoji: custom.icon || '🎖️',
        color: custom.color || 'text-amber-300',
        border: 'border-amber-400/40',
        bg: 'bg-amber-500/15',
        isCustom: true,
        grantedAt: custom.grantedAt,
        grantedBy: custom.grantedBy || 'Администрация',
      });
    }
  }

  return result;
}
