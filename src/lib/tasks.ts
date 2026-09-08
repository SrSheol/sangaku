import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import seedFile from '../data/seed-tasks.json' with { type: 'json' }
import { db } from '../firebase'
import { FIRESTORE_COLLECTION, STORAGE_KEY } from './constants'
import type { SeedFile, Task, TaskFilters, TaskStatus } from '../types'
import { daysUntilDue, todayInMexico, urgencyLevel } from './dates'

const seed = seedFile as SeedFile

export function loadLocalTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Task[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLocalTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // ignore quota
  }
}

export function seedLocalIfEmpty(): Task[] {
  const existing = loadLocalTasks()
  if (existing.length > 0) return existing
  const tasks = seed.tasks.map((t) => ({ ...t }))
  saveLocalTasks(tasks)
  return tasks
}

export function getSeedTasks(): Task[] {
  return seed.tasks.map((t) => ({ ...t }))
}

export function seedMeta() {
  return seed.meta
}

export async function fetchFirestoreTasks(): Promise<Task[] | null> {
  try {
    const snap = await getDocs(collection(db, FIRESTORE_COLLECTION))
    if (snap.empty) return []
    return snap.docs.map((d) => {
      const data = d.data() as Omit<Task, 'id'> & { id?: string }
      return { ...data, id: data.id || d.id } as Task
    })
  } catch {
    return null
  }
}

export async function upsertTaskRemote(task: Task): Promise<boolean> {
  try {
    await setDoc(doc(db, FIRESTORE_COLLECTION, task.id), task, { merge: true })
    return true
  } catch {
    return false
  }
}

/** Carga seed a Firestore solo si la colección está vacía. */
export async function syncSeedToFirestore(): Promise<{ ok: boolean; count: number; message: string }> {
  try {
    const snap = await getDocs(collection(db, FIRESTORE_COLLECTION))
    if (!snap.empty) {
      return {
        ok: false,
        count: snap.size,
        message: `Firestore ya tiene ${snap.size} documentos. No se sobrescribe.`,
      }
    }
    const tasks = getSeedTasks()
    const CHUNK = 400
    for (let i = 0; i < tasks.length; i += CHUNK) {
      const batch = writeBatch(db)
      const slice = tasks.slice(i, i + CHUNK)
      for (const t of slice) {
        batch.set(doc(db, FIRESTORE_COLLECTION, t.id), t)
      }
      await batch.commit()
    }
    saveLocalTasks(tasks)
    return { ok: true, count: tasks.length, message: `Se cargaron ${tasks.length} tareas a Firestore.` }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, count: 0, message: `No se pudo sincronizar: ${msg}` }
  }
}

export function forceLoadSeedLocal(): Task[] {
  const tasks = getSeedTasks()
  saveLocalTasks(tasks)
  return tasks
}

export function computeKpis(tasks: Task[]) {
  const today = todayInMexico()
  let vencidas = 0
  let porVencer = 0
  let enProceso = 0
  let completadas = 0

  for (const t of tasks) {
    if (t.status === 'completada') completadas++
    if (t.status === 'en_proceso') enProceso++
    const urg = urgencyLevel(t.dueAt, t.status, today)
    if (urg === 'overdue') vencidas++
    if (urg === 'soon') porVencer++
  }

  return {
    total: tasks.length,
    vencidas,
    porVencer,
    enProceso,
    completadas,
  }
}

export function filterTasks(tasks: Task[], f: TaskFilters): Task[] {
  const q = f.search.trim().toLowerCase()
  let list = tasks.filter((t) => {
    if (f.status !== 'all' && t.status !== f.status) return false
    if (f.category !== 'all' && t.category !== f.category) return false
    if (q) {
      const hay = `${t.activity} ${t.ot} ${t.assigner} ${t.notes ?? ''} ${t.category}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  const statusOrder: Record<TaskStatus, number> = {
    asignada: 1,
    en_proceso: 2,
    completada: 3,
    cancelada: 4,
  }

  list = [...list].sort((a, b) => {
    switch (f.sort) {
      case 'dueDesc':
        return (b.dueAt || '').localeCompare(a.dueAt || '')
      case 'otAsc':
        return String(a.ot).localeCompare(String(b.ot), undefined, { numeric: true })
      case 'status':
        return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9)
      case 'activity':
        return a.activity.localeCompare(b.activity, 'es')
      case 'dueAsc':
      default: {
        // vencidas primero, luego por fecha
        const da = daysUntilDue(a.dueAt)
        const db_ = daysUntilDue(b.dueAt)
        const ua = urgencyLevel(a.dueAt, a.status)
        const ub = urgencyLevel(b.dueAt, b.status)
        const rank = (u: string) => (u === 'overdue' ? 0 : u === 'soon' ? 1 : u === 'ok' ? 2 : 3)
        const r = rank(ua) - rank(ub)
        if (r !== 0) return r
        return (da ?? 9999) - (db_ ?? 9999)
      }
    }
  })

  return list
}

export function groupByCategory(tasks: Task[]): { category: string; tasks: Task[] }[] {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = t.category
    const arr = map.get(key) ?? []
    arr.push(t)
    map.set(key, arr)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, tasks: items }))
}

export function newTaskId(existing: Task[]): string {
  let max = 0
  for (const t of existing) {
    const m = /^t-(\d+)$/.exec(t.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `t-${String(max + 1).padStart(3, '0')}`
}
