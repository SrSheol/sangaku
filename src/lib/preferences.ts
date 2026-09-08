import {
  DEFAULT_PREFS,
  PREFS_KEY,
  SAVED_FILTERS_ADMIN_KEY,
  SAVED_FILTERS_GUEST_KEY,
  VIEW_ADMIN_KEY,
  VIEW_GUEST_KEY,
} from './constants'
import type { AppView, Preferences, SavedFilter, TaskFilters } from '../types'

type Role = 'admin' | 'guest'

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      reduceMotion: Boolean(parsed.reduceMotion),
      cursor: typeof parsed.cursor === 'boolean' ? parsed.cursor : DEFAULT_PREFS.cursor,
      sound: Boolean(parsed.sound),
      density: parsed.density === 'compact' ? 'compact' : 'comfortable',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePreferences(prefs: Preferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function loadView(role: Role): AppView {
  try {
    const key = role === 'guest' ? VIEW_GUEST_KEY : VIEW_ADMIN_KEY
    const v = localStorage.getItem(key)
    if (v === 'list' || v === 'calendar' || v === 'kanban' || v === 'timeline') return v
  } catch {
    // ignore
  }
  return 'list'
}

export function saveView(role: Role, view: AppView): void {
  try {
    const key = role === 'guest' ? VIEW_GUEST_KEY : VIEW_ADMIN_KEY
    localStorage.setItem(key, view)
  } catch {
    // ignore
  }
}

export function loadSavedFilters(role: Role): SavedFilter[] {
  try {
    const key = role === 'guest' ? SAVED_FILTERS_GUEST_KEY : SAVED_FILTERS_ADMIN_KEY
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedFilter[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveSavedFilters(role: Role, list: SavedFilter[]): void {
  try {
    const key = role === 'guest' ? SAVED_FILTERS_GUEST_KEY : SAVED_FILTERS_ADMIN_KEY
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // ignore
  }
}

export function makeSavedFilter(name: string, filters: TaskFilters): SavedFilter {
  return {
    id: `sf-${Date.now().toString(36)}`,
    name: name.trim(),
    filters: { ...filters },
    createdAt: new Date().toISOString(),
  }
}


export function applyTheme(theme: Preferences['theme']): void {
  document.documentElement.dataset.theme = theme
}
