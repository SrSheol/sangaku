import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAuth } from '../auth/AuthGate'
import { EXPECTED_USER, GUEST_USER, loadStoredFilters, saveStoredFilters } from '../auth/session'
import { useAmbientAudio } from '../hooks/useAmbientAudio'
import { useLenis } from '../hooks/useLenis'
import { CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, STATUSES, VIEW_LABELS } from '../lib/constants'
import {
  computeKpis,
  filterTasks,
  forceLoadSeedLocal,
  forceReseedAll,
  groupByCategory,
  loadAndReconcileTasks,
  newTaskId,
  recordTaskHistory,
  saveLocalTasks,
  seedCount,
  seedLocalIfEmpty,
  seedMeta,
  syncSeedToFirestore,
  upsertTaskRemote,
} from '../lib/tasks'
import {
  loadPreferences,
  loadSavedFilters,
  loadView,
  makeSavedFilter,
  savePreferences,
  saveSavedFilters,
  saveView,
} from '../lib/preferences'
import type {
  AppView,
  Preferences,
  SavedFilter,
  Task,
  TaskFilters,
} from '../types'
import { AddTaskModal } from './ui/AddTaskModal'
import { CustomCursor } from './ui/CustomCursor'
import { PreferencesPanel } from './ui/PreferencesPanel'
import { ShortcutsModal } from './ui/ShortcutsModal'
import { TaskDetail } from './ui/TaskDetail'
import { ListView } from './views/ListView'
import { BrushDivider, KANJI_NUM, SealMark, TornEdge } from './ui/InkAssets'
import { KoiPond } from './ui/KoiPond'

const AmbientScene = lazy(() => import('./ui/AmbientScene'))
const CalendarView = lazy(() => import('./views/CalendarView').then((m) => ({ default: m.CalendarView })))
const KanbanView = lazy(() => import('./views/KanbanView').then((m) => ({ default: m.KanbanView })))
const TimelineView = lazy(() => import('./views/TimelineView').then((m) => ({ default: m.TimelineView })))
const ImportModal = lazy(() => import('./ui/ImportModal').then((m) => ({ default: m.ImportModal })))

const defaultFilters: TaskFilters = {
  status: 'all',
  category: 'all',
  search: '',
  sort: 'dueAsc',
  groupByCategory: true,
}

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
  const [view, setView] = useState<AppView>(() => loadView(role))
  const [prefs, setPrefs] = useState<Preferences>(() => loadPreferences())
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => loadSavedFilters(role))
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Task | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [notifState, setNotifState] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )
  const [ambientPaused, setAmbientPaused] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  useLenis(!prefs.reduceMotion)
  useAmbientAudio(prefs.sound)

  useEffect(() => {
    document.documentElement.dataset.density = prefs.density
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion)
  }, [prefs])

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
    saveView(role, view)
  }, [view, role])

  useEffect(() => {
    savePreferences(prefs)
  }, [prefs])

  useEffect(() => {
    saveSavedFilters(role, savedFilters)
  }, [savedFilters, role])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'Escape') {
        setDetail(null)
        setShowShortcuts(false)
        setShowPrefs(false)
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) {
        if (e.key === '/' && !typing) {
          e.preventDefault()
          searchRef.current?.focus()
        }
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowShortcuts(true)
        return
      }
      if (e.key === '1') setView('list')
      if (e.key === '2') setView('calendar')
      if (e.key === '3') setView('kanban')
      if (e.key === '4') setView('timeline')
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

  const displayActiveGroups = useMemo(
    () =>
      filters.groupByCategory ? groupByCategory(active) : [{ category: 'all', tasks: active }],
    [active, filters.groupByCategory],
  )

  useEffect(() => {
    if (loading || !boardRef.current || prefs.reduceMotion || view !== 'list') return
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
  }, [loading, filtered.length, filters.groupByCategory, filters.status, prefs.reduceMotion, view])

  const updateTask = async (id: string, patch: Partial<Task>, historyKind?: 'status' | 'notes' | 'edit') => {
    if (!isAdmin) return
    const prev = tasks.find((t) => t.id === id)
    const next = tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
    )
    persist(next)
    const updated = next.find((t) => t.id === id)
    if (updated) void upsertTaskRemote(updated)
    if (prev && historyKind === 'status' && patch.status && patch.status !== prev.status) {
      void recordTaskHistory(id, 'status', 'Sheol', STATUS_LABELS[prev.status], STATUS_LABELS[patch.status])
    }
    if (prev && historyKind === 'notes') {
      void recordTaskHistory(id, 'notes', 'Sheol', prev.notes || '—', patch.notes || '—')
    }
    if (detail?.id === id && updated) setDetail(updated)
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
    void recordTaskHistory(task.id, 'created', 'Sheol', undefined, task.activity)
    setShowAdd(false)
    setToast('Tarea añadida')
  }

  const requestNotif = async () => {
    if (typeof Notification === 'undefined') {
      setNotifState('unsupported')
      return
    }
    const perm = await Notification.requestPermission()
    setNotifState(perm)
    if (perm === 'granted') {
      const soon = tasks.filter((t) => {
        if (t.status === 'completada' || t.status === 'cancelada') return false
        const d = t.dueAt
        if (!d) return false
        const days = Math.ceil((Date.parse(d) - Date.now()) / 86400000)
        return days >= 0 && days <= 7
      })
      new Notification('Sangaku', {
        body:
          soon.length > 0
            ? `${soon.length} tarea(s) por vencer en ≤7 días`
            : 'Recordatorios activos · sin vencimientos próximos',
      })
    }
  }

  const sessionLabel = isGuest ? GUEST_USER : EXPECTED_USER
  const showCompletedSection =
    filters.status !== 'asignada' && filters.status !== 'en_proceso' && filters.status !== 'cancelada'
  const showActiveSection =
    filters.status === 'all' ||
    filters.status === 'asignada' ||
    filters.status === 'en_proceso' ||
    filters.status === 'cancelada'

  const viewIndex: Record<AppView, number> = { list: 1, calendar: 2, kanban: 3, timeline: 4 }

  return (
    <motion.div
      className="atelier"
      initial={prefs.reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Suspense fallback={null}>
        <AmbientScene paused={ambientPaused || prefs.reduceMotion} />
      </Suspense>
      <CustomCursor enabled={prefs.cursor && !prefs.reduceMotion} />
      <div className="grain" aria-hidden />
      <div className="atelier-wash" aria-hidden />
      <KoiPond paused={ambientPaused || prefs.reduceMotion} />

      <header className="washi-topbar">
        <div className="rail-brand">
          <SealMark size={38} />
          <span className="rail-brand-label">算額</span>
        </div>

        <nav className="rail-views" aria-label="Vistas">
          {(Object.keys(VIEW_LABELS) as AppView[]).map((v) => (
            <button
              key={v}
              type="button"
              className={`rail-view${view === v ? ' is-active' : ''}`}
              onClick={() => setView(v)}
              title={VIEW_LABELS[v]}
            >
              <span className="rail-num" aria-hidden>
                {KANJI_NUM[viewIndex[v]]}
              </span>
              <span className="rail-label">{VIEW_LABELS[v]}</span>
            </button>
          ))}
        </nav>

        <div className="rail-tools">
          <button
            type="button"
            className="rail-tool"
            title="Preferencias"
            onClick={() => setShowPrefs(true)}
          >
            準
          </button>
          <button
            type="button"
            className="rail-tool"
            title="Atajos de teclado"
            onClick={() => setShowShortcuts(true)}
          >
            ?
          </button>
          <button
            type="button"
            className="rail-tool"
            title={ambientPaused ? 'Reanudar fondo' : 'Pausar fondo'}
            onClick={() => setAmbientPaused((p) => !p)}
          >
            {ambientPaused ? '止' : '動'}
          </button>
          {isAdmin && (
            <button
              type="button"
              className={`rail-tool${toolsOpen ? ' is-active' : ''}`}
              title="Herramientas del taller"
              onClick={() => setToolsOpen((o) => !o)}
            >
              蔵
            </button>
          )}
          <button type="button" className="rail-tool rail-exit" title="Salir" onClick={() => void logout()}>
            出
          </button>
        </div>
      </header>

      <main className="canvas">
        <header className="canvas-header scroll-panel">
          <TornEdge />
          <div className="canvas-titling">
            <p className="canvas-eyebrow">
              算額 · Sangaku · sesión {sessionLabel}
              {isGuest && <span className="eyebrow-guest"> · invitado</span>}
            </p>
            <h1 className="canvas-title">
              Templo de <em>pendientes</em>
            </h1>
            <p className="canvas-sub">
              {tasks.length} tareas registradas · badge {meta.badge}
            </p>
          </div>
          <div className="stamp-row" aria-label="Resumen">
            {[
              { label: 'Total', value: kpis.total, tone: 'ink' },
              { label: 'Vencidas', value: kpis.vencidas, tone: 'crimson' },
              { label: 'Por vencer', value: kpis.porVencer, tone: 'copper' },
              { label: 'En proceso', value: kpis.enProceso, tone: 'gold' },
              { label: 'Completas', value: kpis.completadas, tone: 'ivory' },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                className={`stamp-stat tone-${k.tone}`}
                initial={prefs.reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <CountUp value={loading ? 0 : k.value} />
                <p>{k.label}</p>
              </motion.div>
            ))}
          </div>
          <TornEdge flip />
        </header>

        <BrushDivider />

        {isGuest && (
          <motion.div
            className="guest-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Vista de invitado · solo lectura
          </motion.div>
        )}

        <AnimatePresence>
          {isAdmin && toolsOpen && (
            <motion.section
              className="tools-drawer"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="tools-kicker">蔵 · herramientas del taller</p>
              <div className="tools-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowAdd(true)}>
                  + Tarea
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowImport(true)}>
                  Importar CSV / Excel
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
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.section className="scroll-fold filters" layout transition={{ duration: 0.25 }}>
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
          Agrupar
        </label>
        <div className="saved-filters">
          <select
            value=""
            onChange={(e) => {
              const sf = savedFilters.find((x) => x.id === e.target.value)
              if (sf) setFilters(sf.filters)
            }}
          >
            <option value="">Filtros guardados…</option>
            {savedFilters.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.name}
              </option>
            ))}
          </select>
          <input
            className="save-filter-name"
            placeholder="Nombre preset"
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
          />
          <button
            type="button"
            className="btn-ghost"
            disabled={!saveFilterName.trim()}
            onClick={() => {
              const sf = makeSavedFilter(saveFilterName, filters)
              setSavedFilters((list) => [...list, sf])
              setSaveFilterName('')
              setToast(`Filtro «${sf.name}» guardado`)
            }}
          >
            Guardar filtro
          </button>
        </div>
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
            <motion.div
              key={view}
              initial={prefs.reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefs.reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {view === 'list' && (
                <ListView
                  completed={isGuest ? completed : completed}
                  activeGroups={displayActiveGroups}
                  groupByCategory={filters.groupByCategory}
                  showCompletedSection={showCompletedSection}
                  showActiveSection={showActiveSection && active.length > 0}
                  readOnly={isGuest}
                  density={prefs.density}
                  onStatus={(id, s) => void updateTask(id, { status: s }, 'status')}
                  onDone={(id) => void updateTask(id, { status: 'completada' }, 'status')}
                  onOpen={setDetail}
                />
              )}
              {view === 'calendar' && (
                <Suspense fallback={<div className="skeleton-list"><div className="skeleton-card" /></div>}>
                  <CalendarView tasks={filtered} onOpen={setDetail} />
                </Suspense>
              )}
              {view === 'kanban' && (
                <Suspense fallback={<div className="skeleton-list"><div className="skeleton-card" /></div>}>
                  <KanbanView
                    tasks={filtered}
                    readOnly={isGuest}
                    onStatus={(id, s) => void updateTask(id, { status: s }, 'status')}
                    onOpen={setDetail}
                  />
                </Suspense>
              )}
              {view === 'timeline' && (
                <Suspense fallback={<div className="skeleton-list"><div className="skeleton-card" /></div>}>
                  <TimelineView tasks={filtered} onOpen={setDetail} />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      </main>

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

      <AnimatePresence>
        {detail && (
          <TaskDetail
            key={detail.id}
            task={detail}
            readOnly={isGuest}
            onClose={() => setDetail(null)}
            onStatus={(s) => void updateTask(detail.id, { status: s }, 'status')}
            onSaveNotes={(notes) => {
              void updateTask(detail.id, { notes }, 'notes')
              setToast('Notas guardadas')
            }}
          />
        )}
      </AnimatePresence>

      {isAdmin && showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
      {isAdmin && showImport && (
        <Suspense fallback={null}>
          <ImportModal
            existing={tasks}
            meta={{ collaborator: meta.collaborator, badge: meta.badge }}
            onClose={() => setShowImport(false)}
            onImported={(next, msg) => {
              persist(next)
              void (async () => {
                for (const task of next) await upsertTaskRemote(task)
              })()
              setToast(msg)
            }}
          />
        </Suspense>
      )}
      {showPrefs && (
        <PreferencesPanel
          prefs={prefs}
          onChange={setPrefs}
          onClose={() => setShowPrefs(false)}
          onRequestNotif={() => void requestNotif()}
          notifState={notifState}
        />
      )}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </motion.div>
  )
}
