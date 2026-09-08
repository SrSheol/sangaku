import {
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns'
import { TZ } from './constants'

/** Hoy en America/Mexico_City como Date local (solo fecha). */
export function todayInMexico(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  return startOfDay(parseISO(`${y}-${m}-${d}`))
}

export function parseDay(isoDate: string): Date | null {
  if (!isoDate) return null
  const d = parseISO(isoDate.slice(0, 10))
  return isValid(d) ? startOfDay(d) : null
}

export function formatDay(isoDate: string, pattern = 'dd MMM yyyy'): string {
  const d = parseDay(isoDate)
  if (!d) return isoDate || '—'
  return format(d, pattern)
}

/** Días hasta vencimiento (negativo = vencida). Basado en CDMX. */
export function daysUntilDue(dueAt: string, today = todayInMexico()): number | null {
  const due = parseDay(dueAt)
  if (!due) return null
  return differenceInCalendarDays(due, today)
}

export function urgencyLevel(
  dueAt: string,
  status: string,
  today = todayInMexico(),
): 'overdue' | 'soon' | 'ok' | 'done' {
  if (status === 'completada' || status === 'cancelada') return 'done'
  const days = daysUntilDue(dueAt, today)
  if (days === null) return 'ok'
  if (days < 0) return 'overdue'
  if (days <= 7) return 'soon'
  return 'ok'
}
