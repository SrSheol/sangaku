import { useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { STATUS_LABELS } from '../../lib/constants'
import { urgencyLevel } from '../../lib/dates'
import type { Task } from '../../types'

export function CalendarView({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.dueAt) continue
      const key = t.dueAt.slice(0, 10)
      const arr = map.get(key) ?? []
      arr.push(t)
      map.set(key, arr)
    }
    return map
  }, [tasks])

  return (
    <div className="calendar-view reveal-section">
      <div className="cal-toolbar">
        <button type="button" className="btn-ghost" onClick={() => setCursor((c) => addMonths(c, -1))}>
          ←
        </button>
        <h2>{format(cursor, 'MMMM yyyy', { locale: es })}</h2>
        <button type="button" className="btn-ghost" onClick={() => setCursor((c) => addMonths(c, 1))}>
          →
        </button>
        <button type="button" className="btn-ghost" onClick={() => setCursor(startOfMonth(new Date()))}>
          Hoy
        </button>
      </div>
      <div className="cal-grid">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const items = byDay.get(key) ?? []
          const inMonth = isSameMonth(day, cursor)
          const today = isSameDay(day, new Date())
          return (
            <div key={key} className={`cal-cell${inMonth ? '' : ' is-out'}${today ? ' is-today' : ''}`}>
              <span className="cal-daynum">{format(day, 'd')}</span>
              <div className="cal-items">
                {items.slice(0, 3).map((t) => {
                  const urg = urgencyLevel(t.dueAt, t.status)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`cal-chip urg-${urg}`}
                      title={`${t.activity} · ${STATUS_LABELS[t.status]}`}
                      onClick={() => onOpen(t)}
                    >
                      OT {t.ot}
                    </button>
                  )
                })}
                {items.length > 3 && <span className="cal-more">+{items.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
