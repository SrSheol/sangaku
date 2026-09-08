export const FAIL_COUNT_KEY = 'sangaku-fail-count'
export const LOCKOUT_UNTIL_KEY = 'sangaku-lockout-until'
export const GUEST_SESSION_KEY = 'sangaku-guest-session'
export const FILTERS_ADMIN_KEY = 'sangaku-filters-admin'
export const FILTERS_GUEST_KEY = 'sangaku-filters-guest'
export const BOOT_SKIPPED_KEY = 'sangaku-boot-seen'

/** Usuario UI (case-insensitive); mapea a AUTH_EMAILS */
export const EXPECTED_USER = 'Sheol'
export const GUEST_USER = 'invitado'
export const GUEST_PASSWORD = 'invitado'
export const AUTH_EMAIL = 'sheol@sangaku.app'
export const AUTH_EMAILS = ['sheol@sangaku.app', 'sheol@forge-console.app'] as const

export const MAX_ATTEMPTS = 3
export const LOCKOUT_MS = 60_000

export type AuthRole = 'admin' | 'guest'

export function isExpectedUsername(username: string): boolean {
  return username.trim().toLowerCase() === EXPECTED_USER.toLowerCase()
}

export function isGuestUsername(username: string): boolean {
  return username.trim().toLowerCase() === GUEST_USER.toLowerCase()
}

export function isGuestPassword(password: string): boolean {
  return password === GUEST_PASSWORD
}

export function getGuestSession(): boolean {
  try {
    return sessionStorage.getItem(GUEST_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function setGuestSession(): void {
  try {
    sessionStorage.setItem(GUEST_SESSION_KEY, '1')
  } catch {
    // ignore
  }
}

export function clearGuestSession(): void {
  try {
    sessionStorage.removeItem(GUEST_SESSION_KEY)
  } catch {
    // ignore
  }
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

export function hasSeenBoot(): boolean {
  try {
    return sessionStorage.getItem(BOOT_SKIPPED_KEY) === '1'
  } catch {
    return false
  }
}

export function markBootSeen(): void {
  try {
    sessionStorage.setItem(BOOT_SKIPPED_KEY, '1')
  } catch {
    // ignore
  }
}

export function loadStoredFilters(role: AuthRole): string | null {
  try {
    const key = role === 'guest' ? FILTERS_GUEST_KEY : FILTERS_ADMIN_KEY
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function saveStoredFilters(role: AuthRole, json: string): void {
  try {
    const key = role === 'guest' ? FILTERS_GUEST_KEY : FILTERS_ADMIN_KEY
    localStorage.setItem(key, json)
  } catch {
    // ignore
  }
}
