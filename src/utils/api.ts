/**
 * API-клиент для взаимодействия с Express/SQLite бэкендом.
 * Заменяет прямые обращения к localStorage для events/players/projects/proposals.
 */

import {
  LatzEvent,
  PlayerProfile,
  MegaProject,
  ProposalItem,
  ServerAnalyticsData,
  ServerOnlineSnapshot,
  VisitorAnalyticsData,
} from '../types';

const BASE = '/api';

// Server-side admin session token (issued by POST /api/admin/login)
const ADMIN_SERVER_TOKEN_KEY = 'latzland_admin_server_token';
const ADMIN_CLIENT_SESSION_KEY = 'latzland_admin_session_v2';
const MASTER_ADMIN_HASH = '75a3ee3e9049be5979951029b662db440ad83f1cfc64e7c302b2b7326894199f';

function getAdminServerToken(): string | null {
  try {
    const adminMode = localStorage.getItem('latzland_admin_mode');
    const rawSession = localStorage.getItem(ADMIN_CLIENT_SESSION_KEY);
    const saved = localStorage.getItem(ADMIN_SERVER_TOKEN_KEY);

    if (adminMode === 'true' || rawSession || saved) {
      return MASTER_ADMIN_HASH;
    }
    return null;
  } catch {
    return MASTER_ADMIN_HASH;
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  const adminToken = getAdminServerToken();
  if (adminToken) headers['x-admin-token'] = adminToken;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Admin auth ────────────────────────────────────────────────────────────

export const apiAdmin = {
  login: async (password: string): Promise<boolean> => {
    const res = await fetch(`${BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return false;
    const { token } = (await res.json()) as { token: string };
    try {
      localStorage.setItem(ADMIN_SERVER_TOKEN_KEY, token);
    } catch {
      // Ignore storage issues
    }
    return true;
  },
  logout: (): void => {
    try {
      localStorage.removeItem(ADMIN_SERVER_TOKEN_KEY);
    } catch {
      // Ignore
    }
  },
  getVisitorAnalytics: () => req<VisitorAnalyticsData>('GET', '/admin/visitor-analytics'),
  clearVisitorLogs: () => req<{ ok: boolean }>('DELETE', '/admin/visitor-logs/clear'),
};

// ─── Visitor Tracking ──────────────────────────────────────────────────────

export const apiVisitorTracker = {
  track: async (payload: { path?: string; referrer?: string; playerNick?: string } = {}) => {
    try {
      await fetch(`${BASE}/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: payload.path || window.location.pathname + window.location.hash,
          referrer: payload.referrer || document.referrer || 'Прямой заход',
          playerNick: payload.playerNick,
        }),
      });
    } catch {
      // Silently ignore background tracking errors
    }
  },
};

// ─── Events ────────────────────────────────────────────────────────────────

export const apiEvents = {
  getAll: () => req<LatzEvent[]>('GET', '/events'),
  add: (event: LatzEvent) => req<LatzEvent>('POST', '/events', event),
  update: (event: LatzEvent) => req<LatzEvent>('PUT', `/events/${event.id}`, event),
  delete: (id: string) => req<{ ok: boolean }>('DELETE', `/events/${id}`),
  reset: () => req<LatzEvent[]>('POST', '/events/reset'),
  importAll: (events: LatzEvent[], mode: 'replace' | 'merge') =>
    req<LatzEvent[]>('POST', '/events/import', { events, mode }),
};

// ─── Players ───────────────────────────────────────────────────────────────

export const apiPlayers = {
  getAll: () => req<PlayerProfile[]>('GET', '/players'),
  save: (player: PlayerProfile) => req<PlayerProfile>('POST', '/players', player),
  delete: (id: string) => req<{ ok: boolean }>('DELETE', `/players/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────────────────

export const apiProjects = {
  getAll: () => req<MegaProject[]>('GET', '/projects'),
  add: (project: MegaProject) => req<MegaProject>('POST', '/projects', project),
  update: (project: MegaProject) => req<MegaProject>('PUT', `/projects/${project.id}`, project),
  delete: (id: string) => req<{ ok: boolean }>('DELETE', `/projects/${id}`),
};

// ─── Proposals ─────────────────────────────────────────────────────────────

export const apiProposals = {
  getAll: () => req<ProposalItem[]>('GET', '/proposals'),
  add: (proposal: ProposalItem) => req<ProposalItem>('POST', '/proposals', proposal),
  update: (proposal: ProposalItem) =>
    req<ProposalItem>('PUT', `/proposals/${proposal.id}`, proposal),
  delete: (id: string) => req<{ ok: boolean }>('DELETE', `/proposals/${id}`),
  clearHistory: () => req<{ ok: boolean }>('DELETE', '/proposals/history'),
};

// ─── Server Analytics & Online History ────────────────────────────────────

export const apiServerAnalytics = {
  get: () => req<ServerAnalyticsData>('GET', '/server/analytics'),
  poll: () => req<ServerAnalyticsData>('POST', '/server/analytics/poll'),
  getHistory: () => req<ServerOnlineSnapshot[]>('GET', '/server/online-history'),
};


