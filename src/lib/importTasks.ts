import type { Task, TaskCategory, TaskStatus } from '../types'
import { CATEGORIES, STATUSES } from './constants'
import { newTaskId } from './tasks'

function asString(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function normalizeStatus(raw: string): TaskStatus {
  const s = raw.toLowerCase().replace(/\s+/g, '_')
  if ((STATUSES as string[]).includes(s)) return s as TaskStatus
  const map: Record<string, TaskStatus> = {
    asignada: 'asignada',
    'en proceso': 'en_proceso',
    en_proceso: 'en_proceso',
    completada: 'completada',
    cancelada: 'cancelada',
    done: 'completada',
    pending: 'asignada',
  }
  return map[s] ?? map[raw.toLowerCase()] ?? 'asignada'
}

function normalizeCategory(raw: string): TaskCategory {
  const s = raw.toLowerCase().replace(/\s+/g, '_')
  if ((CATEGORIES as string[]).includes(s)) return s as TaskCategory
  const map: Record<string, TaskCategory> = {
    revision: 'revision',
    revisión: 'revision',
    captura: 'captura',
    generacion_acta: 'generacion_acta',
    'generacion de acta': 'generacion_acta',
    certificado: 'certificado',
    impresion: 'impresion',
    impresión: 'impresion',
    stickers: 'stickers',
    checklist: 'checklist',
  }
  return map[s] ?? map[raw.toLowerCase()] ?? 'revision'
}

function rowToPartial(row: Record<string, unknown>): Partial<Task> & { ot?: string; id?: string } {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (rk) => rk.toLowerCase().replace(/\s+/g, '') === k.toLowerCase().replace(/\s+/g, ''),
      )
      if (found != null && row[found] != null && asString(row[found])) return asString(row[found])
    }
    return ''
  }

  const id = get('id')
  const ot = get('ot', 'OT', 'folio')
  const activity = get('activity', 'actividad', 'tarea', 'descripcion', 'descripción')
  const status = get('status', 'estado')
  const category = get('category', 'categoria', 'categoría')
  const assigner = get('assigner', 'asignador', 'asigno')
  const assignedAt = get('assignedAt', 'asignada', 'fecha_asignacion')
  const dueAt = get('dueAt', 'vence', 'vencimiento', 'fecha_vencimiento')
  const notes = get('notes', 'notas', 'nota')

  return {
    id: id || undefined,
    ot: ot || undefined,
    activity: activity || undefined,
    status: status ? normalizeStatus(status) : undefined,
    category: category ? normalizeCategory(category) : undefined,
    assigner: assigner || undefined,
    assignedAt: assignedAt || undefined,
    dueAt: dueAt || undefined,
    notes: notes || undefined,
  }
}

export async function parseImportFile(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
}

export function mergeImportedRows(
  existing: Task[],
  rows: Record<string, unknown>[],
  meta: { collaborator: string; badge: string },
): { tasks: Task[]; added: number; updated: number } {
  const byId = new Map(existing.map((t) => [t.id, t]))
  const byOt = new Map<string, Task>()
  for (const t of existing) {
    if (t.ot) byOt.set(String(t.ot), t)
  }

  let added = 0
  let updated = 0
  const now = new Date().toISOString()
  const next = [...existing]

  for (const row of rows) {
    const partial = rowToPartial(row)
    if (!partial.activity && !partial.ot && !partial.id) continue

    let target: Task | undefined
    if (partial.id && byId.has(partial.id)) target = byId.get(partial.id)
    else if (partial.ot && byOt.has(partial.ot)) target = byOt.get(partial.ot)

    if (target) {
      const patched: Task = {
        ...target,
        activity: partial.activity ?? target.activity,
        status: partial.status ?? target.status,
        category: partial.category ?? target.category,
        assigner: partial.assigner ?? target.assigner,
        assignedAt: partial.assignedAt ?? target.assignedAt,
        dueAt: partial.dueAt ?? target.dueAt,
        notes: partial.notes ?? target.notes,
        ot: partial.ot ?? target.ot,
        updatedAt: now,
      }
      const idx = next.findIndex((t) => t.id === target!.id)
      if (idx >= 0) next[idx] = patched
      byId.set(patched.id, patched)
      byOt.set(patched.ot, patched)
      updated++
    } else {
      const task: Task = {
        id: partial.id && !byId.has(partial.id) ? partial.id : newTaskId(next),
        activity: partial.activity || `Importada OT ${partial.ot || '?'}`,
        assignedAt: partial.assignedAt || now.slice(0, 10),
        dueAt: partial.dueAt || now.slice(0, 10),
        assigner: partial.assigner || '—',
        status: partial.status || 'asignada',
        ot: partial.ot || '—',
        category: partial.category || 'revision',
        collaborator: meta.collaborator,
        badge: meta.badge,
        notes: partial.notes,
        updatedAt: now,
      }
      next.unshift(task)
      byId.set(task.id, task)
      byOt.set(task.ot, task)
      added++
    }
  }

  return { tasks: next, added, updated }
}
