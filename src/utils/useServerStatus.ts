import { useState, useEffect, useCallback, useRef } from 'react';
import { MinecraftServerStatus } from '../types';

export const SERVER_IP = 'play.latzland.eu';
export const SERVER_VERSION = '26.2 Java';

const INITIAL_STATUS: MinecraftServerStatus = {
  online: false,
  ip: SERVER_IP,
  version: SERVER_VERSION,
  onlinePlayers: 0,
  maxPlayers: 0,
  playerList: [],
  loading: true,
  lastUpdated: undefined,
  error: null,
};

export function useServerStatus(pollIntervalMs = 45000) {
  const [status, setStatus] = useState<MinecraftServerStatus>(INITIAL_STATUS);
  const isFetchingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setStatus((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // 1. Primary endpoint: api.mcstatus.io (fast, rich data with player lists)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      let response: Response | null = null;
      try {
        response = await fetch(
          `https://api.mcstatus.io/v2/status/java/${SERVER_IP}`,
          { signal: controller.signal }
        );
      } catch {
        // network or abort, will fallback
      } finally {
        clearTimeout(timeoutId);
      }

      if (response && response.ok) {
        const data = await response.json();
        const isOnline = Boolean(data.online);
        const playersList: string[] = [];

        if (Array.isArray(data.players?.list)) {
          data.players.list.forEach((p: { name_clean?: string; name_raw?: string }) => {
            const name = p.name_clean || p.name_raw;
            if (name) playersList.push(name);
          });
        }

        const rawVersion = data.version?.name_clean || data.version?.name_raw || SERVER_VERSION;
        const formattedVersion = rawVersion.toLowerCase().includes('26.2')
          ? '26.2 Java'
          : `${rawVersion} (Java)`;

        setStatus({
          online: isOnline,
          ip: SERVER_IP,
          version: formattedVersion,
          onlinePlayers: data.players?.online || 0,
          maxPlayers: data.players?.max || 0,
          playerList: playersList,
          motd: data.motd?.clean || undefined,
          icon: data.icon || undefined,
          loading: false,
          lastUpdated: new Date(),
          error: null,
        });
        return;
      }

      // 2. Secondary fallback endpoint: api.mcsrvstat.us
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), 6000);
      try {
        const fbRes = await fetch(
          `https://api.mcsrvstat.us/3/${SERVER_IP}`,
          { signal: fallbackController.signal }
        );
        clearTimeout(fallbackTimeout);

        if (fbRes.ok) {
          const data = await fbRes.json();
          const isOnline = Boolean(data.online);
          const playersList: string[] = [];

          if (Array.isArray(data.players?.list)) {
            data.players.list.forEach((p: { name?: string } | string) => {
              if (typeof p === 'string') playersList.push(p);
              else if (p && p.name) playersList.push(p.name);
            });
          }

          const rawVersion = data.version || SERVER_VERSION;
          const formattedVersion = String(rawVersion).includes('26.2')
            ? '26.2 Java'
            : `${rawVersion} (Java)`;

          setStatus({
            online: isOnline,
            ip: SERVER_IP,
            version: formattedVersion,
            onlinePlayers: data.players?.online || 0,
            maxPlayers: data.players?.max || 0,
            playerList: playersList,
            motd: Array.isArray(data.motd?.clean)
              ? data.motd.clean.join('\n')
              : data.motd?.clean || undefined,
            icon: data.icon || undefined,
            loading: false,
            lastUpdated: new Date(),
            error: null,
          });
          return;
        }
      } catch {
        // Fallback also failed
      } finally {
        clearTimeout(fallbackTimeout);
      }

      // If both fail:
      setStatus((prev) => ({
        ...prev,
        loading: false,
        online: false,
        error: 'Не удалось получить статус сервера',
        lastUpdated: new Date(),
      }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        online: false,
        error: err instanceof Error ? err.message : 'Ошибка подключения',
        lastUpdated: new Date(),
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      // Don't poll aggressively if user switched tab
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus, pollIntervalMs]);

  return {
    status,
    refresh: fetchStatus,
  };
}
