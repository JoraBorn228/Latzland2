import type { LucideIcon } from 'lucide-react';
import {
  Crown,
  RotateCcw,
  Swords,
  Hammer,
  Cpu,
  Trophy,
  User,
  Skull,
  Coins,
} from 'lucide-react';

export type EventType =
  | 'founding'
  | 'wipe'
  | 'war'
  | 'build'
  | 'tech'
  | 'event'
  | 'player'
  | 'grief'
  | 'trade';

export type TimelineViewMode = 'detailed' | 'compact';

export interface EventCoordinates {
  x: number;
  y?: number;
  z: number;
  dimension?: 'overworld' | 'nether' | 'the_end';
}

export interface PlayerBadge {
  id: string;
  title: string;
  description?: string;
  icon?: string; // Emoji e.g. 🏆, ⚔️, 👑, ⛏️, 💎, ⚡, 🛡️, 🧪, 📜
  color?: string; // Hex color code or css name
  grantedAt?: string;
  grantedBy?: string; // e.g. 'Администрация'
}

export interface PlayerProfile {
  id: string;
  username: string; // Minecraft nickname
  role?: string; // e.g. 'Основатель', 'Строитель', 'Воин', 'Мэр'
  description?: string;
  customAvatar?: string;
  color?: string;
  password?: string; // Пароль для входа в личный кабинет игрока
  registeredAt?: string; // Дата регистрации
  discord?: string;
  telegram?: string;
  homeCoordinates?: string | EventCoordinates;
  customBadges?: PlayerBadge[]; // Персональные знаки отличия и ордена, выданные админом
  assignedBadges?: string[]; // Принудительно включенные ID знаков отличия
  disabledBadges?: string[]; // Принудительно отключенные ID знаков отличия
  // ── Online tracking & statistics ──
  totalOnlineMinutes?: number; // Наигранное время в минутах
  firstSeen?: string; // ISO datetime первого обнаружения на сервере
  lastSeen?: string; // ISO datetime последнего онлайна
  isAutoRegistered?: boolean; // Добавлен ли игрок автоматически сервером при заходе
  sessionCount?: number; // Количество зафиксированных игровых сессий
}

export interface LatzEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string;
  type: EventType;
  important?: boolean;
  link?: string;
  coordinates?: EventCoordinates;
  players?: string[]; // Minecraft nicknames
  season?: number;
  imageUrl?: string;
  parentId?: string; // ID родительского события (ветвление)
  branchName?: string; // Название ветки/сюжетной линии
}

export interface EventCategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeText: string;
  markerBorder: string;
  markerShadow: string;
  cardStripe: string;
}

export const EVENT_CATEGORIES: Record<EventType, EventCategoryConfig> = {
  founding: {
    label: 'Основание',
    icon: Crown,
    color: '#ffd700',
    badgeBg: 'rgba(255, 215, 0, 0.12)',
    badgeText: '#ffd700',
    markerBorder: '#ffd700',
    markerShadow: 'rgba(255, 215, 0, 0.4)',
    cardStripe: 'bg-[#ffd700]',
  },
  wipe: {
    label: 'Вайп',
    icon: RotateCcw,
    color: '#64b5f6',
    badgeBg: 'rgba(100, 181, 246, 0.12)',
    badgeText: '#64b5f6',
    markerBorder: '#64b5f6',
    markerShadow: 'rgba(100, 181, 246, 0.4)',
    cardStripe: 'bg-[#64b5f6]',
  },
  war: {
    label: 'Война',
    icon: Swords,
    color: '#ef5350',
    badgeBg: 'rgba(239, 83, 80, 0.12)',
    badgeText: '#ef5350',
    markerBorder: '#ef5350',
    markerShadow: 'rgba(239, 83, 80, 0.4)',
    cardStripe: 'bg-[#ef5350]',
  },
  build: {
    label: 'Постройка',
    icon: Hammer,
    color: '#66bb6a',
    badgeBg: 'rgba(102, 187, 106, 0.12)',
    badgeText: '#66bb6a',
    markerBorder: '#66bb6a',
    markerShadow: 'rgba(102, 187, 106, 0.4)',
    cardStripe: 'bg-[#66bb6a]',
  },
  tech: {
    label: 'Техника',
    icon: Cpu,
    color: '#ab47bc',
    badgeBg: 'rgba(171, 71, 188, 0.12)',
    badgeText: '#ab47bc',
    markerBorder: '#ab47bc',
    markerShadow: 'rgba(171, 71, 188, 0.4)',
    cardStripe: 'bg-[#ab47bc]',
  },
  event: {
    label: 'Ивент',
    icon: Trophy,
    color: '#ff7043',
    badgeBg: 'rgba(255, 112, 67, 0.12)',
    badgeText: '#ff7043',
    markerBorder: '#ff7043',
    markerShadow: 'rgba(255, 112, 67, 0.4)',
    cardStripe: 'bg-[#ff7043]',
  },
  player: {
    label: 'Игрок',
    icon: User,
    color: '#26c6da',
    badgeBg: 'rgba(38, 198, 218, 0.12)',
    badgeText: '#26c6da',
    markerBorder: '#26c6da',
    markerShadow: 'rgba(38, 198, 218, 0.4)',
    cardStripe: 'bg-[#26c6da]',
  },
  grief: {
    label: 'Гриф',
    icon: Skull,
    color: '#8d6e63',
    badgeBg: 'rgba(141, 110, 99, 0.12)',
    badgeText: '#8d6e63',
    markerBorder: '#8d6e63',
    markerShadow: 'rgba(141, 110, 99, 0.4)',
    cardStripe: 'bg-[#8d6e63]',
  },
  trade: {
    label: 'Торговля',
    icon: Coins,
    color: '#ffb74d',
    badgeBg: 'rgba(255, 183, 77, 0.12)',
    badgeText: '#ffb74d',
    markerBorder: '#ffb74d',
    markerShadow: 'rgba(255, 183, 77, 0.4)',
    cardStripe: 'bg-[#ffb74d]',
  },
};

export interface MinecraftServerStatus {
  online: boolean;
  ip: string;
  version: string;
  onlinePlayers: number;
  maxPlayers: number;
  playerList: string[];
  motd?: string;
  icon?: string;
  loading: boolean;
  lastUpdated?: Date;
  error?: string | null;
}

export type ProjectStatus = 'completed' | 'in_progress' | 'planned' | 'paused';

export interface MegaProject {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progressPercent: number;
  category: 'spawn' | 'infrastructure' | 'mega_base' | 'farm' | 'pvp_arena' | 'monument';
  builders: string[];
  coordinates: EventCoordinates;
  season: number;
  imageUrl?: string;
  materials?: string[];
  features?: string[];
  eventId?: string;
}

export type ProposalType = 'event' | 'project';
export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface ProposalItem {
  id: string;
  type: ProposalType;
  status: ProposalStatus;
  submittedAt: string;
  submittedBy: string;
  eventData?: LatzEvent;
  projectData?: MegaProject;
  userComment?: string;
  rejectReason?: string;
}

// ── Server Online History & Statistics ────────────────────────────────────

export interface ServerOnlineSnapshot {
  id: string;
  timestamp: string; // ISO datetime
  timeLabel: string; // e.g. "14:00"
  dateLabel?: string; // e.g. "08.09"
  onlineCount: number;
  maxOnline?: number; // peak online reached during this hour
  finalOnline?: number; // ending online at completion of this hour
  maxPlayers: number;
  players: string[];
}

export interface ServerTopPlayerPlaytime {
  username: string;
  totalOnlineMinutes: number;
  lastSeen?: string;
  firstSeen?: string;
  role?: string;
  color?: string;
  isOnline?: boolean;
}

export interface ServerAnalyticsData {
  onlineNow: number;
  maxPlayers: number;
  isServerOnline: boolean;
  peakOnline: number;
  peakOnlineTimestamp?: string;
  totalTrackedPlayers: number;
  autoRegisteredPlayersCount: number;
  lastPollTimestamp?: string;
  hourlySnapshots: ServerOnlineSnapshot[];
  topPlayersByPlaytime: ServerTopPlayerPlaytime[];
}

// ── Web Visitor Analytics (Admin-only) ────────────────────────────────────

export interface VisitorLog {
  id: string;
  timestamp: string; // ISO datetime
  dateKey: string; // "YYYY-MM-DD"
  ipMasked: string; // e.g. "89.145.***.***"
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other';
  browser: string;
  os: string;
  path: string;
  referrer: string;
  playerNick?: string;
}

export interface VisitorAnalyticsData {
  totalVisitsAllTime: number;
  totalVisitsToday: number;
  uniqueVisitorsToday: number;
  uniqueVisitorsAllTime: number;
  dailyHistory: Array<{
    date: string;
    views: number;
    uniques: number;
  }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topVisitedPages: Array<{ path: string; count: number }>;
  identifiedPlayerVisits: Array<{
    playerNick: string;
    visitCount: number;
    lastSeenOnSite: string;
  }>;
  recentLogs: VisitorLog[];
}

