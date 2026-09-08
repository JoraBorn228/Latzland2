/**
 * Player utilities for Minecraft avatars and formatting
 */

export function getMinecraftHeadUrl(username: string, size = 32): string {
  // Clean username from any extra characters
  const cleanNick = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanNick) {
    return 'https://mc-heads.net/avatar/MHF_Steve/32';
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(cleanNick)}/${size}`;
}

export function getMinecraftBodyUrl(username: string, height = 160): string {
  const cleanNick = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanNick) {
    return 'https://mc-heads.net/body/MHF_Steve/160';
  }
  return `https://mc-heads.net/body/${encodeURIComponent(cleanNick)}/${height}`;
}

export function getMinecraftSkinDownloadUrl(username: string): string {
  const cleanNick = username.trim().replace(/[^a-zA-Z0-9_]/g, '');
  if (!cleanNick) {
    return 'https://mc-heads.net/skin/MHF_Steve';
  }
  return `https://mc-heads.net/skin/${encodeURIComponent(cleanNick)}`;
}

export function getPlayerColor(username: string): string {
  const colors = [
    '#00e676',
    '#64b5f6',
    '#ffd700',
    '#ff7043',
    '#ab47bc',
    '#26c6da',
    '#ef5350',
    '#66bb6a',
    '#ffb74d',
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Форматирует наигранное время в удобный для чтения вид на русском языке.
 * @param minutes общее количество минут онлайна
 */
export function formatPlaytime(minutes?: number): string {
  if (!minutes || minutes <= 0) return '0 мин.';
  const m = Math.round(minutes);
  const hours = Math.floor(m / 60);
  const remainingMinutes = m % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} дн. ${remainingHours} ч.`;
  }

  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours} ч. ${remainingMinutes} мин.` : `${hours} ч.`;
  }

  return `${remainingMinutes} мин.`;
}

/**
 * Форматирует относительное время последнего онлайна игрока.
 * @param isoDate ISO datetime строка
 */
export function formatLastSeen(isoDate?: string): string {
  if (!isoDate) return 'Не зафиксирован';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return 'Неизвестно';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 3) return 'Только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

