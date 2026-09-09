import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';


// ─── Data Storage ──────────────────────────────────────────────────────────
// In-memory store backed by JSON file persistence for reliability in AI Studio container

interface ServerOnlineSnapshot {
  id: string;
  timestamp: string;
  timeLabel: string;
  dateLabel?: string;
  onlineCount: number;
  maxOnline?: number;
  finalOnline?: number;
  maxPlayers: number;
  players: string[];
}

interface VisitorLogEntry {
  id: string;
  timestamp: string;
  dateKey: string;
  ipMasked: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other';
  browser: string;
  os: string;
  path: string;
  referrer: string;
  playerNick?: string;
}

interface DailyVisitorSummary {
  views: number;
  uniqueIps: string[];
}

interface DatabaseSchema {
  events: Record<string, unknown>;
  players: Record<string, unknown>;
  projects: Record<string, unknown>;
  proposals: Record<string, unknown>;
  onlineSnapshots: Record<string, ServerOnlineSnapshot>;
  visitorLogs: VisitorLogEntry[];
  dailyVisitorStats: Record<string, DailyVisitorSummary>;
  meta: Record<string, string>;
  adminTokens?: Record<string, number>;
}

const DATA_FILE = path.resolve(process.cwd(), 'data_store.json');

const memoryDb: DatabaseSchema = {
  events: {},
  players: {},
  projects: {},
  proposals: {},
  onlineSnapshots: {},
  visitorLogs: [],
  dailyVisitorStats: {},
  meta: {},
  adminTokens: {},
};

function loadDatabase(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.events) memoryDb.events = parsed.events;
      if (parsed.players) memoryDb.players = parsed.players;
      if (parsed.projects) memoryDb.projects = parsed.projects;
      if (parsed.proposals) memoryDb.proposals = parsed.proposals;
      if (parsed.onlineSnapshots) {
        memoryDb.onlineSnapshots = parsed.onlineSnapshots;
        // Keep only real snapshots (from 20:00 UTC on 08.09 onwards, when real live polling began)
        for (const k of Object.keys(memoryDb.onlineSnapshots)) {
          if (k.startsWith('snap-2026-09-07') || (k.startsWith('snap-2026-09-08T') && parseInt(k.slice(16, 18), 10) < 20)) {
            delete memoryDb.onlineSnapshots[k];
          }
        }
        for (const snap of Object.values(memoryDb.onlineSnapshots)) {
          if (snap) {
            if (typeof snap.maxOnline !== 'number') {
              snap.maxOnline = snap.onlineCount ?? 0;
            }
            if (typeof snap.finalOnline !== 'number') {
              snap.finalOnline = snap.onlineCount ?? 0;
            }
          }
        }
      }
      if (parsed.visitorLogs) memoryDb.visitorLogs = parsed.visitorLogs;
      if (parsed.dailyVisitorStats) memoryDb.dailyVisitorStats = parsed.dailyVisitorStats;
      if (parsed.meta) memoryDb.meta = parsed.meta;
      if (parsed.adminTokens) memoryDb.adminTokens = parsed.adminTokens;
    }
  } catch (err) {
    console.warn('Could not read persistent data file, initializing in-memory store:', err);
  }
}

function saveDatabase(): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist data store to disk:', err);
  }
}

loadDatabase();

// ─── Initial Seed ─────────────────────────────────────────────────────────

async function seedInitialDataIfNeeded(): Promise<void> {
  if (memoryDb.meta['seeded'] === '1' && Object.keys(memoryDb.events).length > 0) {
    return;
  }

  console.log('📦 Первый запуск — загружаем начальные данные...');
  try {
    const eventsModule = await import('./src/data/initialEvents.ts' as string).catch(
      () => import('./src/data/initialEvents.js' as string)
    );
    const playersModule = await import('./src/data/initialPlayers.ts' as string).catch(
      () => import('./src/data/initialPlayers.js' as string)
    );
    const projectsModule = await import('./src/data/initialProjects.ts' as string).catch(
      () => import('./src/data/initialProjects.js' as string)
    );
    const proposalsModule = await import('./src/data/initialProposals.ts' as string).catch(
      () => import('./src/data/initialProposals.js' as string)
    );

    const initialEvents = eventsModule.INITIAL_LATZLAND_EVENTS || eventsModule.LATZLAND_EVENTS || [];
    const initialPlayers = playersModule.INITIAL_LATZLAND_PLAYERS || playersModule.INITIAL_PLAYERS || [];
    const initialProjects = projectsModule.INITIAL_LATZLAND_PROJECTS || [];
    const initialProposals = proposalsModule.INITIAL_LATZLAND_PROPOSALS || [];

    for (const e of initialEvents) {
      if (e?.id) memoryDb.events[e.id] = e;
    }
    for (const p of initialPlayers) {
      if (p?.id) memoryDb.players[p.id] = p;
    }
    for (const pr of initialProjects) {
      if (pr?.id) memoryDb.projects[pr.id] = pr;
    }
    for (const prop of initialProposals) {
      if (prop?.id) memoryDb.proposals[prop.id] = prop;
    }

    memoryDb.meta['seeded'] = '1';
    saveDatabase();
    console.log(`  ✓ ${Object.keys(memoryDb.events).length} событий`);
    console.log(`  ✓ ${Object.keys(memoryDb.players).length} игроков`);
    console.log(`  ✓ ${Object.keys(memoryDb.projects).length} проектов`);
    console.log(`  ✓ ${Object.keys(memoryDb.proposals).length} предложений`);
  } catch (err) {
    console.warn('⚠️ Не удалось загрузить начальные данные:', err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getAllRows(table: RecordTableKey): unknown[] {
  return Object.values(memoryDb[table] as Record<string, unknown>);
}

type RecordTableKey = 'events' | 'players' | 'projects' | 'proposals' | 'onlineSnapshots';

function upsertRow(table: RecordTableKey, id: string, data: unknown): void {
  (memoryDb[table] as Record<string, unknown>)[id] = data;
  saveDatabase();
}

function deleteRow(table: RecordTableKey, id: string): void {
  delete (memoryDb[table] as Record<string, unknown>)[id];
  saveDatabase();
}

function clearTable(table: RecordTableKey): void {
  (memoryDb[table] as Record<string, unknown>) = {};
  saveDatabase();
}

// ─── Server Setup ─────────────────────────────────────────────────────────

async function startServer() {
  await seedInitialDataIfNeeded();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // ─── Admin Authentication ───────────────────────────────────────────────
  const ADMIN_SALT = 'latzland_smp_secure_master_salt_2024';
  const ADMIN_PASSWORD_HASH = '75a3ee3e9049be5979951029b662db440ad83f1cfc64e7c302b2b7326894199f';

  const adminTokens = new Map<string, number>();
  const ADMIN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function sha256Hex(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  function isValidAdminToken(token: string): boolean {
    if (!token) return false;
    const cleanToken = String(token).trim();
    if (!cleanToken) return false;

    // 1. Check in-memory map
    const inMemExp = adminTokens.get(cleanToken);
    if (inMemExp && Date.now() <= inMemExp) return true;

    // 2. Check persistent DB tokens
    if (memoryDb.adminTokens && typeof memoryDb.adminTokens === 'object') {
      const dbExp = (memoryDb.adminTokens as Record<string, number>)[cleanToken];
      if (typeof dbExp === 'number' && Date.now() <= dbExp) return true;
    }

    // 3. Check deterministic master token (SHA-256 of salt + hash or direct hash)
    const masterToken = sha256Hex(`${ADMIN_SALT}:${ADMIN_PASSWORD_HASH}`);
    if (cleanToken === masterToken || cleanToken === ADMIN_PASSWORD_HASH) return true;

    return false;
  }

  app.post('/api/admin/login', (req: Request, res: Response) => {
    const password = String(req.body?.password ?? '').trim();
    if (!password || sha256Hex(`${ADMIN_SALT}:${password}`) !== ADMIN_PASSWORD_HASH) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }
    const token = sha256Hex(`${ADMIN_SALT}:${ADMIN_PASSWORD_HASH}:${Date.now()}`);
    const expiresAt = Date.now() + ADMIN_TOKEN_TTL_MS;
    adminTokens.set(token, expiresAt);
    if (!memoryDb.adminTokens) memoryDb.adminTokens = {};
    (memoryDb.adminTokens as Record<string, number>)[token] = expiresAt;
    saveDatabase();
    res.json({ token, masterToken: sha256Hex(`${ADMIN_SALT}:${ADMIN_PASSWORD_HASH}`) });
  });

  function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const token = String(req.headers['x-admin-token'] ?? '');
    if (!isValidAdminToken(token)) {
      res.status(401).json({ error: 'Admin authorization required' });
      return;
    }
    next();
  }

  // ─── API: Events ────────────────────────────────────────────────────────
  app.get('/api/events', (_req: Request, res: Response) => {
    res.json(getAllRows('events'));
  });

  app.post('/api/events', requireAdmin, (req: Request, res: Response) => {
    const event = req.body;
    if (!event?.id) return res.status(400).json({ error: 'Missing id' });
    upsertRow('events', event.id, event);
    res.json(event);
  });

  app.put('/api/events/:id', requireAdmin, (req: Request, res: Response) => {
    const event = { ...req.body, id: req.params.id };
    upsertRow('events', event.id, event);
    res.json(event);
  });

  app.delete('/api/events/:id', requireAdmin, (req: Request, res: Response) => {
    deleteRow('events', req.params.id);
    res.json({ ok: true });
  });

  app.post('/api/events/reset', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const eventsModule = await import('./src/data/initialEvents.ts' as string).catch(
        () => import('./src/data/initialEvents.js' as string)
      );
      const initial = eventsModule.INITIAL_LATZLAND_EVENTS || eventsModule.LATZLAND_EVENTS || [];
      clearTable('events');
      for (const e of initial) {
        if (e?.id) upsertRow('events', e.id, e);
      }
      res.json(initial);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/events/import', requireAdmin, (req: Request, res: Response) => {
    const { events, mode } = req.body as { events: { id: string }[]; mode: 'replace' | 'merge' };
    if (!Array.isArray(events)) return res.status(400).json({ error: 'events must be array' });

    if (mode === 'replace') clearTable('events');
    for (const e of events) {
      if (e?.id) upsertRow('events', e.id, e);
    }
    res.json(getAllRows('events'));
  });

  // ─── API: Players ───────────────────────────────────────────────────────
  app.get('/api/players', (_req: Request, res: Response) => {
    res.json(getAllRows('players'));
  });

  app.post('/api/players', (req: Request, res: Response) => {
    const player = req.body;
    if (!player?.id) return res.status(400).json({ error: 'Missing id' });
    upsertRow('players', player.id, player);
    res.json(player);
  });

  app.delete('/api/players/:id', requireAdmin, (req: Request, res: Response) => {
    deleteRow('players', req.params.id);
    res.json({ ok: true });
  });

  // ─── API: Projects ──────────────────────────────────────────────────────
  app.get('/api/projects', (_req: Request, res: Response) => {
    res.json(getAllRows('projects'));
  });

  app.post('/api/projects', requireAdmin, (req: Request, res: Response) => {
    const project = req.body;
    if (!project?.id) return res.status(400).json({ error: 'Missing id' });
    upsertRow('projects', project.id, project);
    res.json(project);
  });

  app.put('/api/projects/:id', requireAdmin, (req: Request, res: Response) => {
    const project = { ...req.body, id: req.params.id };
    upsertRow('projects', project.id, project);
    res.json(project);
  });

  app.delete('/api/projects/:id', requireAdmin, (req: Request, res: Response) => {
    deleteRow('projects', req.params.id);
    res.json({ ok: true });
  });

  // ─── API: Proposals ─────────────────────────────────────────────────────
  app.get('/api/proposals', (_req: Request, res: Response) => {
    res.json(getAllRows('proposals'));
  });

  app.post('/api/proposals', (req: Request, res: Response) => {
    const proposal = req.body;
    if (!proposal?.id) return res.status(400).json({ error: 'Missing id' });
    upsertRow('proposals', proposal.id, proposal);
    res.json(proposal);
  });

  app.put('/api/proposals/:id', requireAdmin, (req: Request, res: Response) => {
    const proposal = { ...req.body, id: req.params.id };
    upsertRow('proposals', proposal.id, proposal);
    res.json(proposal);
  });

  app.delete('/api/proposals/history', requireAdmin, (_req: Request, res: Response) => {
    for (const id of Object.keys(memoryDb.proposals)) {
      const p = memoryDb.proposals[id] as { status?: string };
      if (p && p.status !== 'pending') {
        delete memoryDb.proposals[id];
      }
    }
    saveDatabase();
    res.json({ ok: true });
  });

  app.delete('/api/proposals/:id', (req: Request, res: Response) => {
    deleteRow('proposals', req.params.id);
    res.json({ ok: true });
  });

  // ─── Online Tracking & Minecraft Server Background Monitor ───────────────
  const SERVER_IP = 'play.latzland.eu';
  const POLL_INTERVAL_MINUTES = 3;
  const POLL_INTERVAL_MS = POLL_INTERVAL_MINUTES * 60 * 1000;
  // Минимальный пауза между реальными запросами к внешнему API статуса,
  // чтобы частые ручные поллы с фронта не спамили mcstatus.io
  const EXTERNAL_QUERY_THROTTLE_MS = 30 * 1000;
  // Если игрока не видели дольше этого промежутка — считаем новой сессией
  const SESSION_GAP_MS = 10 * 60 * 1000;
  // Потолок начисляемого времени за один тик (защита от простоев/перезапусков)
  const MAX_CREDIT_MS = POLL_INTERVAL_MS * 1.5;

  function getPlayerColor(username: string): string {
    const colors = [
      '#00e676', '#64b5f6', '#ffd700', '#ff7043',
      '#ab47bc', '#26c6da', '#ef5350', '#66bb6a', '#ffb74d'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  interface LiveServerFetchResult {
    online: boolean;
    onlinePlayers: number;
    maxPlayers: number;
    playerList: string[];
    version?: string;
    motd?: string;
    lastUpdated?: string;
  }

  let lastLiveServerStatus: LiveServerFetchResult = {
    online: false,
    onlinePlayers: 0,
    maxPlayers: 0,
    playerList: [],
  };
  let lastHourlySnapshotHour = '';

  async function queryMinecraftServer(): Promise<LiveServerFetchResult> {
    // 1. Primary: api.mcstatus.io
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`https://api.mcstatus.io/v2/status/java/${SERVER_IP}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as {
          online?: boolean;
          players?: { online?: number; max?: number; list?: Array<{ name_clean?: string; name_raw?: string }> };
          version?: { name_clean?: string; name_raw?: string };
          motd?: { clean?: string };
        };
        const playersList: string[] = [];
        if (Array.isArray(data.players?.list)) {
          data.players.list.forEach((p) => {
            const name = p.name_clean || p.name_raw;
            if (name) playersList.push(name.trim());
          });
        }
        return {
          online: Boolean(data.online),
          onlinePlayers: data.players?.online || 0,
          maxPlayers: data.players?.max || 0,
          playerList: playersList,
          version: data.version?.name_clean || data.version?.name_raw,
          motd: data.motd?.clean,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch {
      // fallback
    }

    // 2. Fallback: api.mcsrvstat.us
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(`https://api.mcsrvstat.us/3/${SERVER_IP}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = (await res.json()) as {
          online?: boolean;
          players?: { online?: number; max?: number; list?: Array<{ name?: string } | string> };
          version?: string;
        };
        const playersList: string[] = [];
        if (Array.isArray(data.players?.list)) {
          data.players.list.forEach((p) => {
            if (typeof p === 'string' && p.trim()) playersList.push(p.trim());
            else if (typeof p === 'object' && p?.name?.trim()) playersList.push(p.name.trim());
          });
        }
        return {
          online: Boolean(data.online),
          onlinePlayers: data.players?.online || 0,
          maxPlayers: data.players?.max || 0,
          playerList: playersList,
          version: data.version,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch {
      // unreachable
    }

    return {
      online: false,
      onlinePlayers: 0,
      maxPlayers: 0,
      playerList: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  async function queryMinecraftServerThrottled(): Promise<LiveServerFetchResult> {
    // Reuse cached status if the last external query was recent (frontend polls every minute)
    if (
      lastLiveServerStatus.lastUpdated &&
      Date.now() - Date.parse(lastLiveServerStatus.lastUpdated) < EXTERNAL_QUERY_THROTTLE_MS
    ) {
      return lastLiveServerStatus;
    }
    const status = await queryMinecraftServer();
    return status;
  }

  async function recordOnlineStatsTick(): Promise<void> {
    try {
      const status = await queryMinecraftServerThrottled();
      lastLiveServerStatus = status;
      const now = new Date();
      const nowIso = now.toISOString();
      memoryDb.meta['last_poll_time'] = nowIso;

      if (status.online) {
        // Track peak online record
        const currentPeak = Number(memoryDb.meta['peak_online'] || 0);
        if (status.onlinePlayers > currentPeak) {
          memoryDb.meta['peak_online'] = String(status.onlinePlayers);
          memoryDb.meta['peak_online_time'] = nowIso;
        }

        // Process all players seen in this poll
        for (const rawNick of status.playerList) {
          const cleanNick = rawNick.trim().replace(/[^a-zA-Z0-9_]/g, '');
          if (!cleanNick) continue;

          // Look for existing player in memoryDb.players (case-insensitive)
          const existingKey = Object.keys(memoryDb.players).find(
            (k) =>
              (memoryDb.players[k] as { username?: string })?.username?.toLowerCase() ===
              cleanNick.toLowerCase()
          );

          if (existingKey) {
            const p = memoryDb.players[existingKey] as Record<string, unknown>;
            const nowMs = now.getTime();

            // Credit playtime based on ACTUAL elapsed time since the last credit,
            // not a fixed interval — this keeps the counter accurate no matter how
            // often the tick is invoked (server interval, frontend polls, etc.)
            const lastSeenMs = p.lastSeen ? Date.parse(String(p.lastSeen)) : 0;
            const lastCreditedMs = Number(p.lastCreditedAtMs || 0) || lastSeenMs;
            const rawElapsedMs = lastCreditedMs > 0 ? nowMs - lastCreditedMs : POLL_INTERVAL_MS;
            const creditedMs = Math.min(Math.max(rawElapsedMs, 0), MAX_CREDIT_MS);

            p.totalOnlineMinutes = Number(
              (Number(p.totalOnlineMinutes || 0) + creditedMs / 60000).toFixed(1)
            );
            p.lastCreditedAtMs = nowMs;
            p.lastSeen = nowIso;
            if (!p.firstSeen) p.firstSeen = nowIso;

            // Count a new session only when the player was away for a while
            if (!lastSeenMs || nowMs - lastSeenMs > SESSION_GAP_MS) {
              p.sessionCount = Number(p.sessionCount || 0) + 1;
            }
          } else {
            // Automatically register new player discovered online
            const newId = `player-${cleanNick.toLowerCase()}`;
            const newPlayer = {
              id: newId,
              username: cleanNick,
              role: 'Игрок',
              description: 'Автоматически добавлен в реестр игроков при обнаружении онлайна на сервере.',
              color: getPlayerColor(cleanNick),
              registeredAt: nowIso.split('T')[0],
              firstSeen: nowIso,
              lastSeen: nowIso,
              lastCreditedAtMs: now.getTime(),
              totalOnlineMinutes: 0,
              sessionCount: 1,
              isAutoRegistered: true,
            };
            memoryDb.players[newId] = newPlayer;
            console.log(`🤖 [Auto-Register] Новый игрок добавлен в базу данных: ${cleanNick}`);
          }
        }
      }

      // Hourly Snapshot Tracking (always guaranteed every hour, online or offline)
      if (!memoryDb.onlineSnapshots) {
        memoryDb.onlineSnapshots = {};
      }

      const currentHourKey = nowIso.slice(0, 13); // e.g. "2026-09-08T20"
      const snapId = `snap-${currentHourKey}`;
      const hoursStr = String(now.getUTCHours()).padStart(2, '0');
      const minutesStr = '00';
      const dayStr = String(now.getUTCDate()).padStart(2, '0');
      const monthStr = String(now.getUTCMonth() + 1).padStart(2, '0');
      const currentOnlineNow = status.online ? status.onlinePlayers : 0;

      const existingSnap = memoryDb.onlineSnapshots[snapId] as {
        id: string;
        timestamp: string;
        timeLabel: string;
        dateLabel?: string;
        onlineCount: number;
        maxOnline?: number;
        finalOnline?: number;
        maxPlayers: number;
        players: string[];
      } | undefined;

      if (!existingSnap) {
        // A new hour has arrived! A brand new column is added immediately!
        lastHourlySnapshotHour = currentHourKey;
        memoryDb.onlineSnapshots[snapId] = {
          id: snapId,
          timestamp: nowIso,
          timeLabel: `${hoursStr}:${minutesStr}`,
          dateLabel: `${dayStr}.${monthStr}`,
          onlineCount: currentOnlineNow,
          maxOnline: currentOnlineNow,
          finalOnline: currentOnlineNow,
          maxPlayers: status.maxPlayers || 88,
          players: status.online ? [...status.playerList] : [],
        };
        console.log(`📊 [Hourly Snapshot] Добавлен новый срез онлайна за час ${currentHourKey}: ${currentOnlineNow} игроков (пик: ${currentOnlineNow})`);
      } else {
        // Update current hour with live online count, peak tracking, and ending count
        const prevMax = typeof existingSnap.maxOnline === 'number' ? existingSnap.maxOnline : (existingSnap.onlineCount || 0);
        existingSnap.maxOnline = Math.max(prevMax, currentOnlineNow);
        existingSnap.finalOnline = currentOnlineNow;
        existingSnap.onlineCount = currentOnlineNow;
        existingSnap.timeLabel = `${hoursStr}:${minutesStr}`;

        if (status.online) {
          existingSnap.maxPlayers = status.maxPlayers || existingSnap.maxPlayers;
          const mergedPlayers = Array.from(new Set([...(existingSnap.players || []), ...status.playerList]));
          existingSnap.players = mergedPlayers;
          existingSnap.timestamp = nowIso;
        } else {
          existingSnap.timestamp = nowIso;
        }
      }

      // Retain up to 720 snapshots (30 full days of hourly history)
      const allKeys = Object.keys(memoryDb.onlineSnapshots).sort();
      if (allKeys.length > 720) {
        const toDelete = allKeys.slice(0, allKeys.length - 720);
        for (const k of toDelete) {
          delete memoryDb.onlineSnapshots[k];
        }
      }

      saveDatabase();
    } catch (err) {
      console.warn('⚠️ Ошибка фонового опроса онлайна Minecraft:', err);
    }
  }

  // Helper to compile analytics response
  function buildAnalyticsResponse() {
    const allPlayers = Object.values(memoryDb.players) as Array<{
      id: string;
      username: string;
      totalOnlineMinutes?: number;
      lastSeen?: string;
      firstSeen?: string;
      role?: string;
      color?: string;
      isAutoRegistered?: boolean;
    }>;

    const autoRegisteredCount = allPlayers.filter((p) => Boolean(p.isAutoRegistered)).length;
    const peakOnline = Number(memoryDb.meta['peak_online'] || lastLiveServerStatus.onlinePlayers || 0);
    const peakOnlineTimestamp = memoryDb.meta['peak_online_time'] || undefined;

    // Sort snapshots chronologically
    const snapshots = Object.values(memoryDb.onlineSnapshots || {}).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );

    // Top players by playtime
    const topPlayers = [...allPlayers]
      .sort((a, b) => (b.totalOnlineMinutes || 0) - (a.totalOnlineMinutes || 0))
      .slice(0, 30)
      .map((p) => ({
        username: p.username,
        totalOnlineMinutes: p.totalOnlineMinutes || 0,
        lastSeen: p.lastSeen,
        firstSeen: p.firstSeen,
        role: p.role,
        color: p.color,
        isOnline: lastLiveServerStatus.playerList.some(
          (name) => name.toLowerCase() === p.username.toLowerCase()
        ),
      }));

    return {
      onlineNow: lastLiveServerStatus.online ? lastLiveServerStatus.onlinePlayers : 0,
      maxPlayers: lastLiveServerStatus.maxPlayers,
      isServerOnline: lastLiveServerStatus.online,
      peakOnline,
      peakOnlineTimestamp,
      totalTrackedPlayers: allPlayers.length,
      autoRegisteredPlayersCount: autoRegisteredCount,
      lastPollTimestamp: memoryDb.meta['last_poll_time'] || lastLiveServerStatus.lastUpdated,
      hourlySnapshots: snapshots,
      topPlayersByPlaytime: topPlayers,
    };
  }

  // ─── API: Analytics & Online History ────────────────────────────────────
  app.get('/api/server/analytics', (_req: Request, res: Response) => {
    res.json(buildAnalyticsResponse());
  });

  app.post('/api/server/analytics/poll', async (_req: Request, res: Response) => {
    await recordOnlineStatsTick();
    res.json(buildAnalyticsResponse());
  });

  app.get('/api/server/online-history', (_req: Request, res: Response) => {
    const snapshots = Object.values(memoryDb.onlineSnapshots || {}).sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    res.json(snapshots);
  });

  // ─── API: Web Visitor Analytics (Admin-Only & Tracking) ───────────────────
  function maskIp(rawIp: string): string {
    if (!rawIp) return '127.0.0.1';
    if (rawIp.includes(':')) {
      const parts = rawIp.split(':');
      return `${parts.slice(0, 3).join(':')}:****:****`;
    }
    const parts = rawIp.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.***`;
    }
    return rawIp;
  }

  function parseUserAgent(ua: string): {
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other';
    browser: string;
    os: string;
  } {
    const lower = ua.toLowerCase();
    if (
      lower.includes('bot') ||
      lower.includes('crawler') ||
      lower.includes('spider') ||
      lower.includes('uptime')
    ) {
      return { deviceType: 'bot', browser: 'Bot / Crawler', os: 'Неизвестно' };
    }

    let deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'other' = 'desktop';
    if (lower.includes('tablet') || lower.includes('ipad')) {
      deviceType = 'tablet';
    } else if (
      lower.includes('mobile') ||
      lower.includes('android') ||
      lower.includes('iphone')
    ) {
      deviceType = 'mobile';
    }

    let os = 'Другая';
    if (lower.includes('windows')) os = 'Windows';
    else if (lower.includes('macintosh') || lower.includes('mac os')) os = 'macOS';
    else if (lower.includes('iphone') || lower.includes('ipad')) os = 'iOS';
    else if (lower.includes('android')) os = 'Android';
    else if (lower.includes('linux')) os = 'Linux';

    let browser = 'Другой';
    if (lower.includes('edg/')) browser = 'Edge';
    else if (lower.includes('opr/') || lower.includes('opera')) browser = 'Opera';
    else if (lower.includes('yabrowser/')) browser = 'Yandex';
    else if (lower.includes('chrome/') || lower.includes('crios/')) browser = 'Chrome';
    else if (lower.includes('firefox/') || lower.includes('fxios/')) browser = 'Firefox';
    else if (lower.includes('safari/') && !lower.includes('chrome')) browser = 'Safari';

    return { deviceType, browser, os };
  }

  // Public ping for registering site visits
  app.post('/api/track/visit', (req: Request, res: Response) => {
    try {
      const rawHeader = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
      const rawIp = rawHeader.split(',')[0].trim();
      const userAgent = String(req.headers['user-agent'] || '');
      const { deviceType, browser, os } = parseUserAgent(userAgent);
      const ipMasked = maskIp(rawIp);
      const now = new Date();
      const timestamp = now.toISOString();
      const dateKey = timestamp.split('T')[0];
      const pathVisited = String(req.body?.path || '/');
      const referrer = String(req.body?.referrer || req.headers['referer'] || 'Прямой заход');
      const playerNick = req.body?.playerNick ? String(req.body.playerNick).trim() : undefined;

      const logEntry: VisitorLogEntry = {
        id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp,
        dateKey,
        ipMasked,
        deviceType,
        browser,
        os,
        path: pathVisited,
        referrer: referrer.length > 200 ? referrer.slice(0, 200) : referrer,
        playerNick,
      };

      if (!Array.isArray(memoryDb.visitorLogs)) {
        memoryDb.visitorLogs = [];
      }
      memoryDb.visitorLogs.unshift(logEntry);
      if (memoryDb.visitorLogs.length > 500) {
        memoryDb.visitorLogs = memoryDb.visitorLogs.slice(0, 500);
      }

      if (!memoryDb.dailyVisitorStats) {
        memoryDb.dailyVisitorStats = {};
      }
      if (!memoryDb.dailyVisitorStats[dateKey]) {
        memoryDb.dailyVisitorStats[dateKey] = { views: 0, uniqueIps: [] };
      }
      memoryDb.dailyVisitorStats[dateKey].views += 1;
      if (!memoryDb.dailyVisitorStats[dateKey].uniqueIps.includes(ipMasked)) {
        memoryDb.dailyVisitorStats[dateKey].uniqueIps.push(ipMasked);
      }

      const totalVisits = Number(memoryDb.meta['total_visits_count'] || 0) + 1;
      memoryDb.meta['total_visits_count'] = String(totalVisits);

      saveDatabase();
      res.json({ ok: true });
    } catch {
      res.status(200).json({ ok: false });
    }
  });

  // Admin-only: Full Visitor Analytics summary & breakdown
  app.get('/api/admin/visitor-analytics', requireAdmin, (_req: Request, res: Response) => {
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];

    const totalVisitsAllTime = Number(
      memoryDb.meta['total_visits_count'] || (memoryDb.visitorLogs?.length ?? 0)
    );
    const todayStat = memoryDb.dailyVisitorStats?.[todayKey] || { views: 0, uniqueIps: [] };
    const totalVisitsToday = todayStat.views;
    const uniqueVisitorsToday = todayStat.uniqueIps.length;

    const allUniqueIps = new Set<string>();
    Object.values(memoryDb.dailyVisitorStats || {}).forEach((d) => {
      d.uniqueIps?.forEach((ip) => allUniqueIps.add(ip));
    });

    const dailyHistory: Array<{ date: string; views: number; uniques: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      const stat = memoryDb.dailyVisitorStats?.[key] || { views: 0, uniqueIps: [] };
      dailyHistory.push({
        date: key,
        views: stat.views,
        uniques: stat.uniqueIps?.length || 0,
      });
    }

    const deviceBreakdown: Record<string, number> = {};
    const browserBreakdown: Record<string, number> = {};
    const referrerMap: Record<string, number> = {};
    const pagesMap: Record<string, number> = {};
    const playerMap: Record<string, { count: number; lastSeen: string }> = {};

    (memoryDb.visitorLogs || []).forEach((log) => {
      deviceBreakdown[log.deviceType] = (deviceBreakdown[log.deviceType] || 0) + 1;
      browserBreakdown[log.browser] = (browserBreakdown[log.browser] || 0) + 1;

      let refLabel = 'Прямой заход';
      if (log.referrer && log.referrer !== 'Прямой заход') {
        try {
          const u = new URL(log.referrer);
          refLabel = u.hostname;
        } catch {
          refLabel = log.referrer.slice(0, 30);
        }
      }
      referrerMap[refLabel] = (referrerMap[refLabel] || 0) + 1;
      pagesMap[log.path || '/'] = (pagesMap[log.path || '/'] || 0) + 1;

      if (log.playerNick) {
        if (!playerMap[log.playerNick]) {
          playerMap[log.playerNick] = { count: 0, lastSeen: log.timestamp };
        }
        playerMap[log.playerNick].count += 1;
        if (log.timestamp > playerMap[log.playerNick].lastSeen) {
          playerMap[log.playerNick].lastSeen = log.timestamp;
        }
      }
    });

    const topReferrers = Object.entries(referrerMap)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topVisitedPages = Object.entries(pagesMap)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const identifiedPlayerVisits = Object.entries(playerMap)
      .map(([playerNick, data]) => ({
        playerNick,
        visitCount: data.count,
        lastSeenOnSite: data.lastSeen,
      }))
      .sort((a, b) => b.visitCount - a.visitCount);

    res.json({
      totalVisitsAllTime,
      totalVisitsToday,
      uniqueVisitorsToday,
      uniqueVisitorsAllTime: allUniqueIps.size,
      dailyHistory,
      deviceBreakdown,
      browserBreakdown,
      topReferrers,
      topVisitedPages,
      identifiedPlayerVisits,
      recentLogs: (memoryDb.visitorLogs || []).slice(0, 80),
    });
  });

  // Admin-only: Clear visitor analytics history
  app.delete('/api/admin/visitor-logs/clear', requireAdmin, (_req: Request, res: Response) => {
    memoryDb.visitorLogs = [];
    memoryDb.dailyVisitorStats = {};
    memoryDb.meta['total_visits_count'] = '0';
    saveDatabase();
    res.json({ ok: true });
  });

  // Start background monitoring scheduler
  recordOnlineStatsTick();
  setInterval(recordOnlineStatsTick, POLL_INTERVAL_MS);
  console.log(`⏱️ Автоматический сбор статистики онлайна запущен (каждые ${POLL_INTERVAL_MINUTES} мин.)`);

  // ─── Frontend Integration (Vite in Dev / Static dist in Prod) ───────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LatzLand Timeline server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
