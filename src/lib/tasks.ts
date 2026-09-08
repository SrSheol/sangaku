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
import {
  idbLoadTasks,
  idbSaveTasks,
  migrateFromLocalStorage,
  newHistoryId,
  idbAddHistory,
} from './db'
import type { SeedFile, Task, TaskFilters, TaskStatus } from '../types'
import { daysUntilDue, todayInMexico, urgencyLevel } from './dates'

const seed = seedFile as SeedFile
const BATCH_CHUNK = 400

/** Sync mirror — prefer IndexedDB; keep localStorage for migration. */
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
  void idbSaveTasks(tasks)
}

export async function saveTasksPrimary(tasks: Task[]): Promise<void> {
  await idbSaveTasks(tasks)
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

export function seedCount(): number {
  return seed.tasks.length
}

export function seedMeta() {
  return seed.meta
}

function taskRichness(t: Task): number {
  let score = 0
  if (t.activity?.trim()) score += 3
  if (t.ot?.trim()) score += 2
  if (t.assigner?.trim()) score += 1
  if (t.dueAt?.trim()) score += 1
  if (t.assignedAt?.trim()) score += 1
  if (t.notes?.trim()) score += 1
  if (t.category) score += 1
  if (t.status) score += 1
  return score
}

function preferTask(a: Task, b: Task): Task {
  const aTs = a.updatedAt ? Date.parse(a.updatedAt) : NaN
  const bTs = b.updatedAt ? Date.parse(b.updatedAt) : NaN
  const aHas = Number.isFinite(aTs)
  const bHas = Number.isFinite(bTs)
  if (aHas && bHas) return aTs >= bTs ? a : b
  if (aHas && !bHas) return a
  if (bHas && !aHas) return b
  return taskRichness(a) >= taskRichness(b) ? a : b
}

/** Merge remote + local + seed by id; newer updatedAt wins, else richer task. */
export function mergeTaskSets(...sets: (Task[] | null | undefined)[]): Task[] {
  const map = new Map<string, Task>()
  for (const set of sets) {
    if (!set) continue
    for (const t of set) {
      if (!t?.id) continue
      const prev = map.get(t.id)
      map.set(t.id, prev ? preferTask(prev, t) : t)
    }
  }
  return [...map.values()]
}

async function writeTasksBatch(
  tasks: Task[],
  mode: 'merge' | 'overwrite' = 'merge',
): Promise<void> {
  for (let i = 0; i < tasks.length; i += BATCH_CHUNK) {
    const batch = writeBatch(db)
    const slice = tasks.slice(i, i + BATCH_CHUNK)
    for (const t of slice) {
      const ref = doc(db, FIRESTORE_COLLECTION, t.id)
      if (mode === 'overwrite') {
        batch.set(ref, t)
      } else {
        batch.set(ref, t, { merge: true })
      }
    }
    await batch.commit()
  }
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

/**
 * On load: IndexedDB (migrated) + remote + seed merge.
 * Never wipe 172 with a tiny remote subset.
 */
export async function loadAndReconcileTasks(
  localOverride?: Task[],
): Promise<{ tasks: Task[]; toast: string }> {
  const migrated = await migrateFromLocalStorage()
  const fromIdb = migrated.length > 0 ? migrated : await idbLoadTasks()
  const local = localOverride ?? (fromIdb.length > 0 ? fromIdb : loadLocalTasks())
  const seededLocal = local.length > 0 ? local : getSeedTasks()
  if (local.length === 0) await idbSaveTasks(seededLocal)

  const remote = await fetchFirestoreTasks()
  const seedTasks = getSeedTasks()
  const expected = seedTasks.length

  let merged = mergeTaskSets(remote ?? [], seededLocal, seedTasks)

  const missingSeed = seedTasks.filter((s) => !merged.some((m) => m.id === s.id))
  if (merged.length < expected && missingSeed.length > 0) {
    merged = mergeTaskSets(merged, missingSeed)
    await idbSaveTasks(merged)
    try {
      await writeTasksBatch(missingSeed, 'merge')
    } catch {
      // local already saved; remote upsert best-effort
    }
    return {
      tasks: merged,
      toast: `Reconciliado: ${merged.length} tareas (se restauraron ${missingSeed.length} del seed)`,
    }
  }

  await idbSaveTasks(merged)

  if (remote === null) {
    return { tasks: merged, toast: 'Modo local (Firestore no disponible)' }
  }
  if ((remote?.length ?? 0) > 0 && (remote?.length ?? 0) < expected) {
    return {
      tasks: merged,
      toast: `Fusionado local+remoto+seed · ${merged.length} tareas`,
    }
  }
  if ((remote?.length ?? 0) > 0) {
    return { tasks: merged, toast: `Sincronizado · ${merged.length} tareas` }
  }
  return { tasks: merged, toast: '' }
}

export async function syncSeedToFirestore(): Promise<{
  ok: boolean
  count: number
  message: string
}> {
  try {
    const snap = await getDocs(collection(db, FIRESTORE_COLLECTION))
    const tasks = getSeedTasks()
    const existingIds = new Set(snap.docs.map((d) => d.id))

    if (snap.empty) {
      await writeTasksBatch(tasks, 'overwrite')
      await idbSaveTasks(tasks)
      return {
        ok: true,
        count: tasks.length,
        message: `Se cargaron ${tasks.length} tareas a Firestore.`,
      }
    }

    const missing = tasks.filter((t) => !existingIds.has(t.id))
    if (missing.length === 0) {
      return {
        ok: true,
        count: snap.size,
        message: `Firestore ya tiene ${snap.size} documentos; no faltan ids del seed.`,
      }
    }

    await writeTasksBatch(missing, 'merge')
    const local = mergeTaskSets(await idbLoadTasks(), tasks)
    await idbSaveTasks(local)
    return {
      ok: true,
      count: missing.length,
      message: `Se añadieron ${missing.length} tareas faltantes a Firestore (${snap.size + missing.length} total).`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, count: 0, message: `No se pudo sincronizar: ${msg}` }
  }
}

/** Full reseed: 172 seed tasks → local + overwrite all seed docs in Firestore. */
export async function forceReseedAll(): Promise<{
  ok: boolean
  tasks: Task[]
  message: string
}> {
  const tasks = getSeedTasks()
  await idbSaveTasks(tasks)
  try {
    await writeTasksBatch(tasks, 'overwrite')
    return {
      ok: true,
      tasks,
      message: `Restauradas ${tasks.length} tareas (local + Firestore).`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return {
      ok: false,
      tasks,
      message: `Seed local OK (${tasks.length}); Firestore falló: ${msg}`,
    }
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

export async function recordTaskHistory(
  taskId: string,
  kind: 'status' | 'notes' | 'edit' | 'created' | 'import',
  by: string,
  from?: string,
  to?: string,
): Promise<void> {
  await idbAddHistory({
    id: newHistoryId(),
    taskId,
    at: new Date().toISOString(),
    kind,
    from,
    to,
    by,
  })
}
