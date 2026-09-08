// Input validation, XSS prevention, and data sanitizer utilities

/**
 * Escapes potentially hazardous HTML characters to prevent Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips script tags, iframes, onerror handlers and dangerous HTML elements from user strings.
 */
export function sanitizeText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  let cleaned = input
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove dangerous tags like iframe, object, embed, form
    .replace(/<\/?(iframe|object|embed|applet|meta|link|base|form|input|button|style)[^>]*>/gi, '')
    // Remove inline event handlers like onclick=, onerror=, onload=
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Remove javascript: pseudo-protocol
    .replace(/javascript:[^"'\s]*/gi, '');

  return cleaned.trim();
}

/**
 * Strictly sanitizes external URLs.
 * Ensures only http:, https: or relative paths are permitted.
 * Blocks dangerous protocols like javascript:, data:text/html, vbscript:, blob:.
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Allow safe image data URIs for user-uploaded thumbnails (PNG, JPEG, WEBP, GIF only)
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }

  // Reject all other data: schemes, javascript:, vbscript:, file:
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return '';
  }

  // Allow valid http and https URLs
  if (/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(trimmed)) {
    return trimmed;
  }

  // Allow relative paths starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  return '';
}

/**
 * Validates a Minecraft nickname based on official Mojang rules:
 * - 2 to 16 characters
 * - Only letters (a-z, A-Z), numbers (0-9), and underscores (_)
 */
export function validateMinecraftNick(nick: string): {
  valid: boolean;
  cleanNick: string;
  errorMessage?: string;
} {
  const clean = nick.trim();
  if (!clean) {
    return { valid: false, cleanNick: '', errorMessage: 'Никнейм не может быть пустым' };
  }

  if (clean.length < 2 || clean.length > 16) {
    return {
      valid: false,
      cleanNick: clean,
      errorMessage: 'Никнейм Minecraft должен содержать от 2 до 16 символов',
    };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return {
      valid: false,
      cleanNick: clean,
      errorMessage: 'Никнейм может содержать только латинские буквы, цифры и знак «_»',
    };
  }

  return { valid: true, cleanNick: clean };
}

/**
 * Validates in-game coordinates to prevent numeric overflow or invalid data.
 */
export function validateCoordinateNumber(num: any): number | null {
  const n = Number(num);
  if (isNaN(n) || !isFinite(n)) return null;
  // Standard Minecraft world bounds
  if (n < -30000000 || n > 30000000) return null;
  return Math.round(n);
}

/**
 * Validates in-game Minecraft coordinate triplet.
 */
export function validateCoordinates(
  x: any,
  y: any,
  z: any
): { valid: boolean; x: number; y: number; z: number } {
  const numX = validateCoordinateNumber(x);
  const numZ = validateCoordinateNumber(z);
  const numY = y !== undefined && y !== '' && y !== null ? validateCoordinateNumber(y) : 64;

  if (numX === null || numZ === null) {
    return { valid: false, x: 0, y: 64, z: 0 };
  }
  return { valid: true, x: numX, y: numY ?? 64, z: numZ };
}

/**
 * Safely parses JSON string with protection against Prototype Pollution (`__proto__`, `constructor`).
 */
export function safeJsonParse<T>(jsonStr: string, fallback: T): T {
  try {
    const parsed = JSON.parse(jsonStr, (key, value) => {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return undefined; // Drop hazardous prototype overrides
      }
      return value;
    });
    return parsed as T;
  } catch {
    return fallback;
  }
}
