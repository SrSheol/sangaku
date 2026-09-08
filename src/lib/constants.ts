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
  list: 'Rollo',
  calendar: 'Calendario',
  kanban: 'Flujo',
  timeline: 'Línea',
}

export const VIEW_HINTS: Record<AppView, string> = {
  list: 'orden por urgencia, en temples',
  calendar: 'el mes, día por día',
  kanban: 'la procesión por estado',
  timeline: 'el tramo de tiempo completo',
}

export const VIEW_GLYPHS: Record<AppView, string> = {
  list: '一',
  calendar: '二',
  kanban: '三',
  timeline: '四',
}

export const URGENCY_BUCKET_LABELS: Record<string, string> = {
  overdue: 'Vencidas',
  today: 'Hoy',
  week: 'Esta semana',
  later: 'Más adelante',
  closed: 'Cerradas',
}

export const URGENCY_BUCKET_GLYPHS: Record<string, string> = {
  overdue: '蔵',
  today: '今',
  week: '週',
  later: '遠',
  closed: '済',
}

export const URGENCY_BUCKET_HINTS: Record<string, string> = {
  overdue: 'el sello que reclama atención primero',
  today: 'lo que el día de hoy pide',
  week: 'lo que se acerca en los próximos días',
  later: 'sin prisa, aún en reposo',
  closed: 'completadas y canceladas — el archivo',
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
  theme: 'dark',
}
