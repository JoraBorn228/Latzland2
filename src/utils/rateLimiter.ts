// Rate limiter and brute-force mitigation utility
// Protects authentication endpoints, login forms, and administrative access from automated attacks

interface RateLimitRecord {
  failedAttempts: number;
  lockoutUntil: number;
  lastAttempt: number;
}

const RATE_LIMIT_PREFIX = 'latzland_ratelimit_';

/**
 * Checks if an action is currently rate-limited / locked out.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  lockoutDurationMs: number = 60000
): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutSecondsLeft: number;
} {
  try {
    const raw = sessionStorage.getItem(`${RATE_LIMIT_PREFIX}${key}`);
    if (!raw) {
      return { allowed: true, remainingAttempts: maxAttempts, lockoutSecondsLeft: 0 };
    }

    const record: RateLimitRecord = JSON.parse(raw);
    const now = Date.now();

    // If currently locked out
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const secondsLeft = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutSecondsLeft: secondsLeft,
      };
    }

    // If lockout has expired or no lockout
    const remaining = Math.max(0, maxAttempts - record.failedAttempts);
    return {
      allowed: true,
      remainingAttempts: remaining,
      lockoutSecondsLeft: 0,
    };
  } catch {
    return { allowed: true, remainingAttempts: maxAttempts, lockoutSecondsLeft: 0 };
  }
}

/**
 * Records a failed attempt and activates lockout if threshold is exceeded.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
  baseLockoutDurationMs: number = 60000
): {
  isLockedOut: boolean;
  lockoutSeconds: number;
  attemptsCount: number;
} {
  try {
    const now = Date.now();
    const storageKey = `${RATE_LIMIT_PREFIX}${key}`;
    const raw = sessionStorage.getItem(storageKey);
    let record: RateLimitRecord = raw
      ? JSON.parse(raw)
      : { failedAttempts: 0, lockoutUntil: 0, lastAttempt: now };

    record.failedAttempts += 1;
    record.lastAttempt = now;

    if (record.failedAttempts >= maxAttempts) {
      // Exponential backoff: increases lockout for repeated locks
      const multiplier = Math.min(5, Math.floor(record.failedAttempts / maxAttempts));
      const lockoutDuration = baseLockoutDurationMs * multiplier;
      record.lockoutUntil = now + lockoutDuration;
      sessionStorage.setItem(storageKey, JSON.stringify(record));

      return {
        isLockedOut: true,
        lockoutSeconds: Math.ceil(lockoutDuration / 1000),
        attemptsCount: record.failedAttempts,
      };
    }

    sessionStorage.setItem(storageKey, JSON.stringify(record));
    return {
      isLockedOut: false,
      lockoutSeconds: 0,
      attemptsCount: record.failedAttempts,
    };
  } catch {
    return { isLockedOut: false, lockoutSeconds: 0, attemptsCount: 1 };
  }
}

/**
 * Resets rate limit counters upon successful authentication or action.
 */
export function resetRateLimit(key: string): void {
  try {
    sessionStorage.removeItem(`${RATE_LIMIT_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}
