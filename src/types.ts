export type TaskStatus = 'asignada' | 'en_proceso' | 'completada' | 'cancelada'

export type TaskCategory =
  | 'revision'
  | 'captura'
  | 'generacion_acta'
  | 'certificado'
  | 'impresion'
  | 'stickers'
  | 'checklist'

export interface Task {
  id: string
  activity: string
  assignedAt: string
  dueAt: string
  assigner: string
  status: TaskStatus
  ot: string
  category: TaskCategory
  collaborator: string
  badge: string
  notes?: string
  updatedAt?: string
}

export interface SeedFile {
  meta: {
    collaborator: string
    badge: string
    sourceDate: string
  }
  tasks: Task[]
}

export type SortKey = 'dueAsc' | 'dueDesc' | 'otAsc' | 'status' | 'activity'

export interface TaskFilters {
  status: TaskStatus | 'all'
  category: TaskCategory | 'all'
  search: string
  sort: SortKey
  groupByCategory: boolean
}

export type AppView = 'list' | 'calendar' | 'kanban' | 'timeline'

export type Density = 'comfortable' | 'compact'

export type ThemeMode = 'dark' | 'light'

export interface Preferences {
  reduceMotion: boolean
  cursor: boolean
  sound: boolean
  density: Density
  theme: ThemeMode
}

export interface SavedFilter {
  id: string
  name: string
  filters: TaskFilters
  createdAt: string
}

export type HistoryKind = 'status' | 'notes' | 'edit' | 'created' | 'import'

export interface TaskHistoryEntry {
  id: string
  taskId: string
  at: string
  kind: HistoryKind
  from?: string
  to?: string
  by: string
}

export interface TaskComment {
  id: string
  taskId: string
  at: string
  text: string
  by: string
}
