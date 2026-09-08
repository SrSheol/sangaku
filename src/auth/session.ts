export const FAIL_COUNT_KEY = 'sangaku-fail-count'
export const LOCKOUT_UNTIL_KEY = 'sangaku-lockout-until'

/** Usuario UI (case-insensitive); mapea a AUTH_EMAILS */
export const EXPECTED_USER = 'Sheol'
export const AUTH_EMAIL = 'sheol@sangaku.app'
export const AUTH_EMAILS = ['sheol@sangaku.app', 'sheol@forge-console.app'] as const

export const MAX_ATTEMPTS = 3
export const LOCKOUT_MS = 60_000

export function isExpectedUsername(username: string): boolean {
  return username.trim().toLowerCase() === EXPECTED_USER.toLowerCase()
}

export function getFailCount(): number {
  try {
    const n = Number(sessionStorage.getItem(FAIL_COUNT_KEY) || '0')
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function setFailCount(n: number): void {
  try {
    sessionStorage.setItem(FAIL_COUNT_KEY, String(n))
  } catch {
    // ignore
  }
}

export function resetFailCount(): void {
  try {
    sessionStorage.removeItem(FAIL_COUNT_KEY)
  } catch {
    // ignore
  }
}

export function getLockoutUntil(): number {
  try {
    const n = Number(sessionStorage.getItem(LOCKOUT_UNTIL_KEY) || '0')
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function setLockoutUntil(ts: number): void {
  try {
    sessionStorage.setItem(LOCKOUT_UNTIL_KEY, String(ts))
  } catch {
    // ignore
  }
}

export function clearLockout(): void {
  try {
    sessionStorage.removeItem(LOCKOUT_UNTIL_KEY)
    sessionStorage.removeItem(FAIL_COUNT_KEY)
  } catch {
    // ignore
  }
}
