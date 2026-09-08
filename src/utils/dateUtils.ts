const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

/**
 * Parses YYYY-MM-DD safely without timezone shifts
 */
export function parseISODate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  return {
    year: parts[0] || 2026,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Formats "2026-08-20" into "20 августа 2026"
 */
export function formatRussianDate(isoDate: string): string {
  if (!isoDate) return '';
  const { year, month, day } = parseISODate(isoDate);
  const monthName = MONTHS_RU[month - 1] || '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Calculates days between earliest date and now
 */
export function getDaysSinceDate(earliestIsoDate: string): number {
  if (!earliestIsoDate) return 0;
  const { year, month, day } = parseISODate(earliestIsoDate);
  const start = new Date(year, month - 1, day).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}
