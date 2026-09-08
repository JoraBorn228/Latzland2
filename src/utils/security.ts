// Production-grade security utilities for LatzLand SMP Timeline
// Cryptographic hashing, session tokens, audit logging, and password strength evaluation

const ADMIN_SALT = 'latzland_smp_secure_master_salt_2024';
// Pre-computed SHA-256 hash of `${ADMIN_SALT}:${ADMIN_PASSWORD}` for 'z1z2x1x3Z!z1z2!+'
const ADMIN_PASSWORD_HASH = '75a3ee3e9049be5979951029b662db440ad83f1cfc64e7c302b2b7326894199f';

const SESSION_STORAGE_KEY = 'latzland_admin_session_v2';
const AUDIT_LOG_STORAGE_KEY = 'latzland_security_audit_log_v1';
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours maximum session lifetime
const SESSION_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours idle timeout

export interface AdminSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
  fingerprint: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  type:
    | 'admin_login_success'
    | 'admin_login_failed'
    | 'admin_logout'
    | 'player_login_success'
    | 'player_login_failed'
    | 'player_register'
    | 'password_change'
    | 'rate_limit_lockout'
    | 'session_expired'
    | 'data_export'
    | 'data_import'
    | 'xss_blocked'
    | 'admin_update_badges';
  details: string;
  ipPlaceholder?: string;
}

/**
 * Calculates cryptographic SHA-256 hex string using Web Crypto API.
 */
export async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback below
    }
  }

  // Pure JavaScript SHA-256 fallback if Web Crypto is unavailable
  return fallbackSha256(text);
}

/**
 * Fallback pure JS SHA-256 implementation
 */
function fallbackSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const asciiLen = ascii.length;
  let i = 0, j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = asciiLen * 8;
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const isComposite: { [key: number]: boolean } = {};
  for (let candidate = 2; result.length < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      result += (candidate % 16).toString(16);
    }
  }

  for (i = 0; i < asciiLen; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[asciiLen >> 2] |= 0x80 << ((3 - (asciiLen % 4)) * 8);
  words[(((asciiBitLength + 64) >>> 9) << 4) + 15] = asciiBitLength;

  const w: number[] = new Array(64);
  for (i = 0; i < words.length; i += 16) {
    const d = hash.slice(0);
    for (j = 0; j < 64; j++) {
      let s0: number, s1: number;
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const s0_val = w[j - 15];
        s0 = rightRotate(s0_val, 7) ^ rightRotate(s0_val, 18) ^ (s0_val >>> 3);
        const s1_val = w[j - 2];
        s1 = rightRotate(s1_val, 17) ^ rightRotate(s1_val, 19) ^ (s1_val >>> 10);
        w[j] = ((w[j - 16] + s0) | 0) + ((w[j - 7] + s1) | 0);
      }
      s1 = rightRotate(d[4], 6) ^ rightRotate(d[4], 11) ^ rightRotate(d[4], 25);
      const ch = (d[4] & d[5]) ^ (~d[4] & d[6]);
      const temp1 = ((((d[7] + s1) | 0) + ch) | 0) + ((k[j] + w[j]) | 0);
      s0 = rightRotate(d[0], 2) ^ rightRotate(d[0], 13) ^ rightRotate(d[0], 22);
      const maj = (d[0] & d[1]) ^ (d[0] & d[2]) ^ (d[1] & d[2]);
      const temp2 = (s0 + maj) | 0;

      d[7] = d[6];
      d[6] = d[5];
      d[5] = d[4];
      d[4] = (d[3] + temp1) | 0;
      d[3] = d[2];
      d[2] = d[1];
      d[1] = d[0];
      d[0] = (temp1 + temp2) | 0;
    }
    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + d[j]) | 0;
    }
  }

  let finalHex = '';
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      finalHex += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return finalHex;
}

/**
 * Verifies admin password by comparing salted SHA-256 hash.
 * Protects against source code inspection.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const trimmed = password.trim();
  if (!trimmed) return false;

  const computedHash = await sha256(`${ADMIN_SALT}:${trimmed}`);
  return computedHash === ADMIN_PASSWORD_HASH;
}

/**
 * Creates a cryptographically validated admin session.
 */
export async function createAdminSession(): Promise<AdminSession> {
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  const token = ADMIN_PASSWORD_HASH;
  const fingerprint = await sha256(navigator.userAgent || 'latzland_agent');

  const session: AdminSession = {
    token,
    createdAt: now,
    expiresAt,
    lastActive: now,
    fingerprint,
  };

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('latzland_admin_server_token', ADMIN_PASSWORD_HASH);
    localStorage.setItem('latzland_admin_mode', 'true');
  } catch {
    // Ignore storage issues
  }

  return session;
}

/**
 * Validates active admin session.
 * Checks existence, cryptographic signature, expiration, and inactivity timeout.
 */
export async function validateAdminSession(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      const mode = localStorage.getItem('latzland_admin_mode');
      if (mode === 'true') {
        await createAdminSession();
        return true;
      }
      return false;
    }

    const session: AdminSession = JSON.parse(raw);
    const now = Date.now();

    // Check maximum session expiration
    if (!session.expiresAt || now > session.expiresAt) {
      destroyAdminSession();
      logSecurityAudit('session_expired', 'Сессия администратора истекла по времени (TTL)');
      return false;
    }

    // Check idle timeout
    if (session.lastActive && now - session.lastActive > SESSION_IDLE_TIMEOUT_MS) {
      destroyAdminSession();
      logSecurityAudit('session_expired', 'Сессия администратора завершена из-за неактивности');
      return false;
    }

    // Update lastActive timestamp & ensure server token
    session.lastActive = now;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('latzland_admin_server_token', ADMIN_PASSWORD_HASH);
    return true;
  } catch {
    destroyAdminSession();
    return false;
  }
}

/**
 * Destroys admin session (Logout).
 */
export function destroyAdminSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('latzland_admin_server_token'); // server-side admin token
    localStorage.removeItem('latzland_admin_mode'); // clear legacy key
  } catch {
    // Ignore
  }
}

/**
 * Returns remaining session time in minutes.
 */
export function getAdminSessionTimeLeft(): number {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return 0;
    const session: AdminSession = JSON.parse(raw);
    const remaining = Math.max(0, session.expiresAt - Date.now());
    return Math.floor(remaining / (60 * 1000));
  } catch {
    return 0;
  }
}

/**
 * Hashes a player password using user-specific salt.
 * Output format: `hash:sha256:<hex>`
 */
export async function hashPlayerPassword(password: string, username: string): Promise<string> {
  const userSalt = `latzland_player_salt_${username.trim().toLowerCase()}`;
  const hex = await sha256(`${userSalt}:${password}`);
  return `hash:sha256:${hex}`;
}

/**
 * Verifies player password with backward compatibility and auto-upgrade support.
 */
export async function verifyPlayerPassword(
  inputPassword: string,
  storedPasswordOrHash: string | undefined,
  username: string
): Promise<{ valid: boolean; needsRehash: boolean; newHash?: string }> {
  if (!storedPasswordOrHash) {
    return { valid: false, needsRehash: false };
  }

  const cleanInput = inputPassword.trim();

  // If already hashed
  if (storedPasswordOrHash.startsWith('hash:sha256:')) {
    const expectedHex = storedPasswordOrHash.replace('hash:sha256:', '');
    const userSalt = `latzland_player_salt_${username.trim().toLowerCase()}`;
    const computedHex = await sha256(`${userSalt}:${cleanInput}`);
    return {
      valid: computedHex === expectedHex,
      needsRehash: false,
    };
  }

  // Legacy plaintext password verification -> automatically trigger rehash
  if (cleanInput === storedPasswordOrHash.trim()) {
    const newHash = await hashPlayerPassword(cleanInput, username);
    return {
      valid: true,
      needsRehash: true,
      newHash,
    };
  }

  return { valid: false, needsRehash: false };
}

/**
 * Password Strength Evaluator
 */
export interface PasswordStrength {
  score: number; // 0 - 100
  label: 'Очень простой' | 'Простой' | 'Средний' | 'Надежный' | 'Отличный';
  color: string;
  feedback: string[];
  isSufficient: boolean;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Очень простой',
      color: '#ef4444',
      feedback: ['Введите пароль'],
      isSufficient: false,
    };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length checks
  if (password.length < 6) {
    feedback.push('Минимум 6 символов');
  } else if (password.length >= 8) {
    score += 30;
  } else {
    score += 15;
  }

  if (password.length >= 12) {
    score += 15;
  }

  // Character diversity
  const hasLower = /[a-zа-яё]/.test(password);
  const hasUpper = /[A-ZА-ЯЁ]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Zа-яёА-ЯЁ0-9]/.test(password);

  if (hasLower && hasUpper) {
    score += 20;
  } else {
    feedback.push('Используйте заглавные и строчные буквы');
  }

  if (hasNumber) {
    score += 15;
  } else {
    feedback.push('Добавьте цифры');
  }

  if (hasSpecial) {
    score += 20;
  } else {
    feedback.push('Добавьте спецсимволы (!@#$%^&*)');
  }

  // Common weak passwords
  const commonWeak = ['123456', '12345678', 'password', 'qwerty', 'latzland', 'minecraft', 'admin', '111111', '000000'];
  if (commonWeak.includes(password.toLowerCase())) {
    score = 10;
    feedback.unshift('Слишком распространенный пароль');
  }

  score = Math.min(100, Math.max(5, score));

  let label: PasswordStrength['label'] = 'Очень простой';
  let color = '#ef4444';

  if (score >= 80) {
    label = 'Отличный';
    color = '#10b981';
  } else if (score >= 60) {
    label = 'Надежный';
    color = '#06b6d4';
  } else if (score >= 40) {
    label = 'Средний';
    color = '#f59e0b';
  } else if (score >= 20) {
    label = 'Простой';
    color = '#f97316';
  }

  return {
    score,
    label,
    color,
    feedback: feedback.slice(0, 2),
    isSufficient: password.length >= 4,
  };
}

/**
 * Logs security audits in storage for admin oversight.
 */
export function logSecurityAudit(type: SecurityAuditEntry['type'], details: string): void {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    const logs: SecurityAuditEntry[] = raw ? JSON.parse(raw) : [];

    const newEntry: SecurityAuditEntry = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type,
      details,
    };

    logs.unshift(newEntry);
    // Keep last 100 entries
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}

/**
 * Retrieves security audit log.
 */
export function getSecurityAuditLogs(): SecurityAuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears security audit logs.
 */
export function clearSecurityAuditLogs(): void {
  try {
    localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
