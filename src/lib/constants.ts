import type { TaskCategory, TaskStatus } from '../types'

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

export const STORAGE_KEY = 'sangaku-pendientes-v1'
export const FIRESTORE_COLLECTION = 'pendientes'
export const TZ = 'America/Mexico_City'
