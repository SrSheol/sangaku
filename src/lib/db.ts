import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { IDB_NAME, IDB_VERSION, STORAGE_KEY } from './constants'
import type { Task, TaskComment, TaskHistoryEntry } from '../types'

interface SangakuDB extends DBSchema {
  tasks: {
    key: string
    value: Task
    indexes: { 'by-ot': string; 'by-status': string }
  }
  history: {
    key: string
    value: TaskHistoryEntry
    indexes: { 'by-task': string }
  }
  comments: {
    key: string
    value: TaskComment
    indexes: { 'by-task': string }
  }
  meta: {
    key: string
    value: { key: string; value: string }
  }
}

let dbPromise: Promise<IDBPDatabase<SangakuDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SangakuDB>(IDB_NAME, IDB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
          tasks.createIndex('by-ot', 'ot')
          tasks.createIndex('by-status', 'status')
        }
        if (!db.objectStoreNames.contains('history')) {
          const history = db.createObjectStore('history', { keyPath: 'id' })
          history.createIndex('by-task', 'taskId')
        }
        if (!db.objectStoreNames.contains('comments')) {
          const comments = db.createObjectStore('comments', { keyPath: 'id' })
          comments.createIndex('by-task', 'taskId')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

/** Migrate localStorage tasks into IndexedDB once, then keep both in sync. */
export async function migrateFromLocalStorage(): Promise<Task[]> {
  const db = await getDb()
  const existing = await db.getAll('tasks')
  if (existing.length > 0) return existing

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Task[]
    if (!Array.isArray(parsed) || parsed.length === 0) return []
    const tx = db.transaction('tasks', 'readwrite')
    await Promise.all(parsed.map((t) => tx.store.put(t)))
    await tx.done
    return parsed
  } catch {
    return []
  }
}

export async function idbLoadTasks(): Promise<Task[]> {
  const db = await getDb()
  return db.getAll('tasks')
}

export async function idbSaveTasks(tasks: Task[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('tasks', 'readwrite')
  await tx.store.clear()
  await Promise.all(tasks.map((t) => tx.store.put(t)))
  await tx.done
  // Mirror for migration / backup (best-effort)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // ignore quota
  }
}

export async function idbUpsertTask(task: Task): Promise<void> {
  const db = await getDb()
  await db.put('tasks', task)
  try {
    const all = await db.getAll('tasks')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}

export async function idbAddHistory(entry: TaskHistoryEntry): Promise<void> {
  const db = await getDb()
  await db.put('history', entry)
}

export async function idbGetHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  const db = await getDb()
  const rows = await db.getAllFromIndex('history', 'by-task', taskId)
  return rows.sort((a, b) => b.at.localeCompare(a.at))
}

export async function idbAddComment(comment: TaskComment): Promise<void> {
  const db = await getDb()
  await db.put('comments', comment)
}

export async function idbGetComments(taskId: string): Promise<TaskComment[]> {
  const db = await getDb()
  const rows = await db.getAllFromIndex('comments', 'by-task', taskId)
  return rows.sort((a, b) => a.at.localeCompare(b.at))
}

export function newHistoryId(): string {
  return `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function newCommentId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
