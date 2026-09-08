import type { AppView, Preferences, TaskCategory, TaskStatus } from '../types'

export const CATEGORIES: TaskCategory[] = [
  'revision',
  'captura',
  'generacion_acta',
  'certificado',
  'impresion',
  'stickers',
  'checklist',
]

export const STATUSES: TaskStatus[] = [
  'asignada',
  'en_proceso',
  'completada',
  'cancelada',
]

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  revision: 'Revisión',
  captura: 'Captura',
  generacion_acta: 'Generación de acta',
  certificado: 'Certificado',
  impresion: 'Impresión',
  stickers: 'Stickers',
  checklist: 'Checklist',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  asignada: 'Asignada',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export const VIEW_LABELS: Record<AppView, string> = {
  list: 'Lista',
  calendar: 'Calendario',
  kanban: 'Kanban',
  timeline: 'Línea de tiempo',
}

export const STORAGE_KEY = 'sangaku-pendientes-v1'
export const FIRESTORE_COLLECTION = 'pendientes'
export const TZ = 'America/Mexico_City'

export const PREFS_KEY = 'sangaku-prefs-v1'
export const VIEW_ADMIN_KEY = 'sangaku-view-admin'
export const VIEW_GUEST_KEY = 'sangaku-view-guest'
export const SAVED_FILTERS_ADMIN_KEY = 'sangaku-saved-filters-admin'
export const SAVED_FILTERS_GUEST_KEY = 'sangaku-saved-filters-guest'
export const IDB_NAME = 'sangaku-db'
export const IDB_VERSION = 1

export const DEFAULT_PREFS: Preferences = {
  reduceMotion: false,
  cursor: true,
  sound: false,
  density: 'comfortable',
}
