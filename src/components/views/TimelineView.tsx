import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  addDays,
  differenceInCalendarDays,
  format,
  max,
  min,
  parseISO,
  startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { CATEGORY_LABELS, STATUS_LABELS } from '../../lib/constants'
import { todayInMexico, urgencyLevel } from '../../lib/dates'
import type { Task, TaskCategory } from '../../types'

export function TimelineView({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
}) {
  const { start, end, span, rows, todayPct } = useMemo(() => {
    const today = todayInMexico()
    const dated = tasks.filter((t) => t.assignedAt || t.dueAt)
    if (dated.length === 0) {
      return {
        start: today,
        end: addDays(today, 28),
        span: 28,
        rows: [] as { task: Task; left: number; width: number }[],
        todayPct: 0,
      }
    }
    const starts = dated.map((t) => startOfDay(parseISO((t.assignedAt || t.dueAt).slice(0, 10))))
    const ends = dated.map((t) => startOfDay(parseISO((t.dueAt || t.assignedAt).slice(0, 10))))
    let s = min(starts)
    let e = max(ends)
    // pad
    s = addDays(s, -3)
    e = addDays(e, 7)
    const sp = Math.max(14, differenceInCalendarDays(e, s) || 14)
    const rows = dated
      .slice()
      .sort((a, b) => (a.assignedAt || '').localeCompare(b.assignedAt || ''))
      .map((task) => {
        const a = startOfDay(parseISO((task.assignedAt || task.dueAt).slice(0, 10)))
        const d = startOfDay(parseISO((task.dueAt || task.assignedAt).slice(0, 10)))
        const left = Math.max(0, differenceInCalendarDays(a, s))
        const width = Math.max(1, differenceInCalendarDays(d, a) + 1)
        return { task, left: (left / sp) * 100, width: (width / sp) * 100 }
      })
    const tPct = Math.min(100, Math.max(0, (differenceInCalendarDays(today, s) / sp) * 100))
    return { start: s, end: e, span: sp, rows, todayPct: tPct }
  }, [tasks])

  const ticks = useMemo(() => {
    const out: { label: string; pct: number }[] = []
    const step = Math.max(1, Math.ceil(span / 8))
    for (let i = 0; i <= span; i += step) {
      out.push({
        label: format(addDays(start, i), 'dd MMM'),
        pct: (i / span) * 100,
      })
    }
    return out
  }, [start, span])

  if (rows.length === 0) {
    return (
      <div className="empty-state reveal-section">
        <div className="empty-seal" aria-hidden>
          空
        </div>
        <h2>Sin fechas</h2>
        <p>No hay tareas con rango asignada→vence para la línea de tiempo.</p>
      </div>
    )
  }

  return (
    <div className="timeline-view reveal-section">
      <div className="tl-scale">
        {ticks.map((t) => (
          <span key={t.label + t.pct} style={{ left: `${t.pct}%` }}>
            {t.label}
          </span>
        ))}
        {todayPct >= 0 && todayPct <= 100 && (
          <span className="tl-today-tick" style={{ left: `${todayPct}%` }}>
            hoy
          </span>
        )}
      </div>
      <div className="tl-rows">
        {todayPct >= 0 && todayPct <= 100 && (
          <div className="tl-today-line" style={{ left: `calc(7.5rem + ${todayPct}% * (100% - 7.5rem) / 100)` }} aria-hidden />
        )}
        {rows.map(({ task, left, width }, idx) => {
          const urg = urgencyLevel(task.dueAt, task.status)
          const clampedWidth = Math.min(100 - left, width)
          return (
            <motion.button
              key={task.id}
              type="button"
              className={`tl-row status-${task.status}`}
              onClick={() => onOpen(task)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(idx, 30) * 0.02, duration: 0.28 }}
            >
              <span className="tl-label">OT {task.ot}</span>
              <span className="tl-track">
                <motion.span
                  className={`tl-bar urg-${urg}`}
                  style={{ left: `${left}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedWidth}%` }}
                  transition={{ delay: Math.min(idx, 30) * 0.02 + 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {task.activity}
                </motion.span>
                <span className="tl-tooltip" style={{ left: `${left}%` }} role="tooltip">
                  <strong>{task.activity}</strong>
                  <span>{STATUS_LABELS[task.status]} · {CATEGORY_LABELS[task.category as TaskCategory] ?? task.category}</span>
                  <span>Vence {format(parseISO(task.dueAt.slice(0, 10)), 'dd MMM yyyy', { locale: es })}</span>
                </span>
              </span>
            </motion.button>
          )
        })}
      </div>
      <p className="tl-caption">
        {format(start, 'dd MMM yyyy')} — {format(end, 'dd MMM yyyy')}
      </p>
    </div>
  )
}
