import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../auth/AuthGate'
import { useLenis } from '../hooks/useLenis'
import { EXPECTED_USER, GUEST_USER, loadStoredFilters, saveStoredFilters } from '../auth/session'
import { CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, STATUSES } from '../lib/constants'
import { formatDay, urgencyLevel, daysUntilDue } from '../lib/dates'
import {
  computeKpis,
  filterTasks,
  forceLoadSeedLocal,
  forceReseedAll,
  groupByCategory,
  loadAndReconcileTasks,
  newTaskId,
  saveLocalTasks,
  seedCount,
  seedLocalIfEmpty,
  seedMeta,
  syncSeedToFirestore,
  upsertTaskRemote,
} from '../lib/tasks'
import type { Task, TaskCategory, TaskFilters, TaskStatus } from '../types'

const defaultFilters: TaskFilters = {
  status: 'all',
  category: 'all',
  search: '',
  sort: 'dueAsc',
  groupByCategory: true,
}

const STAGGER_LIMIT = 18

gsap.registerPlugin(ScrollTrigger)

function parseFilters(raw: string | null): TaskFilters {
  if (!raw) return defaultFilters
  try {
    const parsed = JSON.parse(raw) as Partial<TaskFilters>
    return {
      status: parsed.status ?? 'all',
      category: parsed.category ?? 'all',
      search: typeof parsed.search === 'string' ? parsed.search : '',
      sort: parsed.sort ?? 'dueAsc',
      groupByCategory: typeof parsed.groupByCategory === 'boolean' ? parsed.groupByCategory : true,
    }
  } catch {
    return defaultFilters
  }
}

function CountUp({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 18 })
  const display = useTransform(spring, (v) => Math.round(v))
  const [text, setText] = useState('0')

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  useEffect(() => {
    const unsub = display.on('change', (v) => setText(String(v)))
    return () => unsub()
  }, [display])

  return <strong>{text}</strong>
}

export function Dashboard() {
  const { logout, role, isGuest, isAdmin } = useAuth()
  const meta = seedMeta()
  const [tasks, setTasks] = useState<Task[]>(() => seedLocalIfEmpty())
  const [filters, setFilters] = useState<TaskFilters>(() => parseFilters(loadStoredFilters(role)))
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  useLenis(true)


  const persist = useCallback((next: Task[]) => {
    setTasks(next)
    saveLocalTasks(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { tasks: reconciled, toast: msg } = await loadAndReconcileTasks()
      if (cancelled) return
      persist(reconciled)
      if (msg) setToast(msg)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [persist])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 3800)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    saveStoredFilters(role, JSON.stringify(filters))
  }, [filters, role])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const kpis = useMemo(() => computeKpis(tasks), [tasks])
  const filtered = useMemo(() => filterTasks(tasks, filters), [tasks, filters])

  const { completed, active } = useMemo(() => {
    const done = filtered.filter((t) => t.status === 'completada')
    const rest = filtered.filter((t) => t.status !== 'completada')
    return { completed: done, active: rest }
  }, [filtered])

  const activeGroups = useMemo(
    () =>
      filters.groupByCategory && !isGuest
        ? groupByCategory(active)
        : [{ category: 'all', tasks: active }],
    [active, filters.groupByCategory, isGuest],
  )

  // Guest: also allow groupByCategory on actives if they toggle it
  const guestActiveGroups = useMemo(
    () =>
      filters.groupByCategory ? groupByCategory(active) : [{ category: 'all', tasks: active }],
    [active, filters.groupByCategory],
  )

  const displayActiveGroups = isGuest ? guestActiveGroups : activeGroups

  useEffect(() => {
    if (loading || !boardRef.current) return
    const sections = boardRef.current.querySelectorAll('.reveal-section')
    const triggers: ScrollTrigger[] = []
    sections.forEach((el) => {
      const tween = gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        },
      )
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger)
    })
    ScrollTrigger.refresh()
    return () => {
      triggers.forEach((t) => t.kill())
    }
  }, [loading, filtered.length, filters.groupByCategory, filters.status])


  const updateTask = async (id: string, patch: Partial<Task>) => {
    if (!isAdmin) return
    const next = tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
    )
    persist(next)
    const updated = next.find((t) => t.id === id)
    if (updated) void upsertTaskRemote(updated)
  }

  const handleSeedLocal = () => {
    if (!isAdmin) return
    const seeded = forceLoadSeedLocal()
    persist(seeded)
    setToast(`Seed local: ${seeded.length} tareas cargadas`)
  }

  const handleSyncFirestore = async () => {
    if (!isAdmin) return
    setBusy(true)
    const res = await syncSeedToFirestore()
    setBusy(false)
    setToast(res.message)
    if (res.ok) {
      const { tasks: reconciled } = await loadAndReconcileTasks()
      persist(reconciled)
    }
  }

  const handleForceReseed = async () => {
    if (!isAdmin) return
    setBusy(true)
    const res = await forceReseedAll()
    setBusy(false)
    persist(res.tasks)
    setToast(res.message)
  }

  const handleAdd = (draft: Omit<Task, 'id' | 'collaborator' | 'badge'>) => {
    if (!isAdmin) return
    const task: Task = {
      ...draft,
      id: newTaskId(tasks),
      collaborator: meta.collaborator,
      badge: meta.badge,
      updatedAt: new Date().toISOString(),
    }
    const next = [task, ...tasks]
    persist(next)
    void upsertTaskRemote(task)
    setShowAdd(false)
    setToast('Tarea añadida')
  }

  const sessionLabel = isGuest ? GUEST_USER : EXPECTED_USER

  return (
    <motion.div
      className="app-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grain" aria-hidden />
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden />
          <div>
            <h1>
              Sangaku <span className="jp">算額</span>
            </h1>
            <p>Pendientes · {tasks.length} tareas</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="user-chip" title="Sesión activa">
            Sesión · {sessionLabel}
          </span>
          {isAdmin && (
            <>
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(true)}>
                + Tarea
              </button>
              <button type="button" className="btn-ghost" onClick={handleSeedLocal}>
                Cargar seed
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={() => void handleForceReseed()}
              >
                {busy ? 'Restaurando…' : `Restaurar ${seedCount()}`}
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={busy}
                onClick={() => void handleSyncFirestore()}
              >
                {busy ? 'Sincronizando…' : 'Sync Firestore'}
              </button>
            </>
          )}
          <button type="button" className="btn-seal btn-seal-sm" onClick={() => void logout()}>
            Salir
          </button>
        </div>
      </header>

      {isGuest && (
        <motion.div
          className="guest-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Vista de invitado · solo lectura
        </motion.div>
      )}

      <section className="kpi-grid">
        {[
          { label: 'Total', value: kpis.total, tone: 'ink' },
          { label: 'Vencidas', value: kpis.vencidas, tone: 'crimson' },
          { label: 'Por vencer ≤7d', value: kpis.porVencer, tone: 'copper' },
          { label: 'En proceso', value: kpis.enProceso, tone: 'gold' },
          { label: 'Completadas', value: kpis.completadas, tone: 'ivory' },
        ].map((k, i) => (
          <motion.article
            key={k.label}
            className={`kpi-card tone-${k.tone}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p>{k.label}</p>
            <CountUp value={loading ? 0 : k.value} />
          </motion.article>
        ))}
      </section>

      <motion.section
        className="filters glass-panel"
        layout
        transition={{ duration: 0.25 }}
      >
        <input
          ref={searchRef}
          className="search"
          placeholder="Buscar actividad, OT, asignador…  (/)"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value as TaskFilters['status'] }))
          }
        >
          <option value="all">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value as TaskFilters['category'] }))
          }
        >
          <option value="all">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select
          value={filters.sort}
          onChange={(e) =>
            setFilters((f) => ({ ...f, sort: e.target.value as TaskFilters['sort'] }))
          }
        >
          <option value="dueAsc">Urgencia / vencimiento</option>
          <option value="dueDesc">Vencimiento ↓</option>
          <option value="otAsc">OT</option>
          <option value="status">Estado</option>
          <option value="activity">Actividad A–Z</option>
        </select>
        <label className="toggle">
          <input
            type="checkbox"
            checked={filters.groupByCategory}
            onChange={(e) => setFilters((f) => ({ ...f, groupByCategory: e.target.checked }))}
          />
          Agrupar por categoría
        </label>
        <p className="filter-count">
          {filtered.length} / {tasks.length}
        </p>
      </motion.section>

      <div className="task-board" ref={boardRef}>
        {loading ? (
          <div className="skeleton-list" aria-busy aria-label="Cargando tareas">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-seal" aria-hidden>
              空
            </div>
            <h2>Sin coincidencias</h2>
            <p>Ajusta filtros o la búsqueda para revelar tareas del sello.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {completed.length > 0 && filters.status !== 'asignada' && filters.status !== 'en_proceso' && filters.status !== 'cancelada' && (
              <motion.section
                key="completed"
                className="category-block section-completed reveal-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="category-title section-divider">
                  <span className="hairline" />
                  Completadas
                  <span className="count">{completed.length}</span>
                </h2>
                <div className="card-list">
                  {completed.map((task, idx) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={idx}
                      readOnly={isGuest}
                      onStatus={(status) => void updateTask(task.id, { status })}
                      onDone={() => void updateTask(task.id, { status: 'completada' })}
                      onEditNotes={() => {
                        if (isGuest) return
                        setEditingNotes(task.id)
                        setNotesDraft(task.notes ?? '')
                      }}
                    />
                  ))}
                </div>
              </motion.section>
            )}

            {(filters.status === 'all' ||
              filters.status === 'asignada' ||
              filters.status === 'en_proceso' ||
              filters.status === 'cancelada') &&
              active.length > 0 && (
                <motion.section
                  key="active-wrap"
                  className="category-block reveal-section"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {completed.length > 0 &&
                    filters.status === 'all' && (
                      <h2 className="category-title section-divider">
                        <span className="hairline" />
                        Activas
                        <span className="count">{active.length}</span>
                      </h2>
                    )}
                  {displayActiveGroups.map((g) => (
                    <div key={g.category} className="category-sub">
                      {filters.groupByCategory && g.category !== 'all' && (
                        <h3 className="category-title nested">
                          <span className="hairline" />
                          {CATEGORY_LABELS[g.category as TaskCategory] ?? g.category}
                          <span className="count">{g.tasks.length}</span>
                        </h3>
                      )}
                      <div className="card-list">
                        {g.tasks.map((task, idx) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={idx}
                            readOnly={isGuest}
                            onStatus={(status) => void updateTask(task.id, { status })}
                            onDone={() => void updateTask(task.id, { status: 'completada' })}
                            onEditNotes={() => {
                              if (isGuest) return
                              setEditingNotes(task.id)
                              setNotesDraft(task.notes ?? '')
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.section>
              )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 28, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 12, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {isAdmin && editingNotes && (
        <Modal title="Notas" onClose={() => setEditingNotes(null)}>
          <textarea
            rows={5}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Añadir notas internas…"
          />
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={() => setEditingNotes(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-seal btn-seal-sm"
              onClick={() => {
                void updateTask(editingNotes, { notes: notesDraft.trim() })
                setEditingNotes(null)
                setToast('Notas guardadas')
              }}
            >
              Guardar
            </button>
          </div>
        </Modal>
      )}

      {isAdmin && showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </motion.div>
  )
}

function TaskCard({
  task,
  index,
  readOnly,
  onStatus,
  onDone,
  onEditNotes,
}: {
  task: Task
  index: number
  readOnly?: boolean
  onStatus: (s: TaskStatus) => void
  onDone: () => void
  onEditNotes: () => void
}) {
  const urg = urgencyLevel(task.dueAt, task.status)
  const days = daysUntilDue(task.dueAt)
  const stagger = index < STAGGER_LIMIT ? index * 0.028 : 0
  const done = task.status === 'completada'

  return (
    <motion.article
      className={`task-card urg-${urg}${done ? ' is-done' : ''}${readOnly ? ' is-readonly' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stagger, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        readOnly
          ? undefined
          : {
              y: -2,
              transition: { duration: 0.25 },
            }
      }
    >
      <div className="card-main">
        <div className="card-top">
          <span className="ot-badge">OT {task.ot}</span>
          <motion.span
            key={task.status}
            className={`status-pill status-${task.status}`}
            initial={{ scale: 0.85, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
          >
            {STATUS_LABELS[task.status]}
          </motion.span>
          {done && <span className="check-seal" aria-hidden>✓</span>}
        </div>
        <h3 className={done ? 'struck' : undefined}>{task.activity}</h3>
        <div className="card-meta">
          <div className="meta-row">
            <span className="meta-label">Vence</span>
            <span className={`due due-${urg}`}>
              {formatDay(task.dueAt)}
              {days !== null && urg !== 'done' && (
                <em>
                  {' '}
                  ·{' '}
                  {days < 0
                    ? `${Math.abs(days)}d vencida`
                    : days === 0
                      ? 'hoy'
                      : `${days}d`}
                </em>
              )}
            </span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Asignó</span>
            <span>{task.assigner}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Asignada</span>
            <span>{formatDay(task.assignedAt)}</span>
          </div>
        </div>
        {task.notes && <p className="notes-preview">{task.notes}</p>}
      </div>
      {!readOnly && (
        <div className="card-actions">
          <select
            value={task.status}
            onChange={(e) => onStatus(e.target.value as TaskStatus)}
            aria-label="Cambiar estado"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button type="button" className="btn-ghost" onClick={onEditNotes}>
            Notas
          </button>
          {task.status !== 'completada' && (
            <button type="button" className="btn-seal btn-seal-sm" onClick={onDone}>
              Hecha
            </button>
          )}
        </div>
      )}
    </motion.article>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="modal glass-panel"
        role="dialog"
        aria-modal
        aria-label={title}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {children}
      </motion.div>
    </div>
  )
}

function AddTaskModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (draft: Omit<Task, 'id' | 'collaborator' | 'badge'>) => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [activity, setActivity] = useState('')
  const [ot, setOt] = useState('')
  const [category, setCategory] = useState<TaskCategory>('revision')
  const [status, setStatus] = useState<TaskStatus>('asignada')
  const [dueAt, setDueAt] = useState(today)
  const [assignedAt, setAssignedAt] = useState(today)
  const [assigner, setAssigner] = useState('Judith Díaz de la Vega Ponce')
  const [notes, setNotes] = useState('')

  return (
    <Modal title="Nueva tarea" onClose={onClose}>
      <div className="form-grid">
        <label>
          Actividad
          <input value={activity} onChange={(e) => setActivity(e.target.value)} required />
        </label>
        <label>
          OT
          <input value={ot} onChange={(e) => setOt(e.target.value)} required />
        </label>
        <label>
          Categoría
          <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Asignada
          <input type="date" value={assignedAt} onChange={(e) => setAssignedAt(e.target.value)} />
        </label>
        <label>
          Vence
          <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
        <label className="span-2">
          Asignador
          <input value={assigner} onChange={(e) => setAssigner(e.target.value)} />
        </label>
        <label className="span-2">
          Notas
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-seal btn-seal-sm"
          disabled={!activity.trim() || !ot.trim()}
          onClick={() =>
            onSave({
              activity: activity.trim(),
              ot: ot.trim(),
              category,
              status,
              assignedAt,
              dueAt,
              assigner: assigner.trim() || '—',
              notes: notes.trim() || undefined,
            })
          }
        >
          Crear
        </button>
      </div>
    </Modal>
  )
}
