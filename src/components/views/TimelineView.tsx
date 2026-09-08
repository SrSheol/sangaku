import { useMemo } from 'react'
import {
  addDays,
  differenceInCalendarDays,
  format,
  max,
  min,
  parseISO,
  startOfDay,
} from 'date-fns'
import { STATUS_LABELS } from '../../lib/constants'
import { todayInMexico } from '../../lib/dates'
import type { Task } from '../../types'

export function TimelineView({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
}) {
  const { start, end, span, rows } = useMemo(() => {
    const today = todayInMexico()
    const dated = tasks.filter((t) => t.assignedAt || t.dueAt)
    if (dated.length === 0) {
      return {
        start: today,
        end: addDays(today, 28),
        span: 28,
        rows: [] as { task: Task; left: number; width: number }[],
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
    return { start: s, end: e, span: sp, rows }
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
      </div>
      <div className="tl-rows">
        {rows.map(({ task, left, width }) => (
          <button
            key={task.id}
            type="button"
            className={`tl-row status-${task.status}`}
            onClick={() => onOpen(task)}
            title={`${task.activity} · ${STATUS_LABELS[task.status]}`}
          >
            <span className="tl-label">OT {task.ot}</span>
            <span className="tl-track">
              <span className="tl-bar" style={{ left: `${left}%`, width: `${Math.min(100 - left, width)}%` }}>
                {task.activity}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="tl-caption">
        {format(start, 'dd MMM yyyy')} — {format(end, 'dd MMM yyyy')}
      </p>
    </div>
  )
}
