import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function CalendarView({
  tasks,
  onOpen,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [dir, setDir] = useState(1)
  const [openDay, setOpenDay] = useState<string | null>(null)

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

  const nav = (n: number) => {
    setDir(n)
    setCursor((c) => addMonths(c, n))
    setOpenDay(null)
  }

  const goToday = () => {
    setDir(0)
    setCursor(startOfMonth(new Date()))
    setOpenDay(null)
  }

  const openItems = openDay ? byDay.get(openDay) ?? [] : []
  const openDate = openDay ? new Date(`${openDay}T00:00:00`) : null

  return (
    <div className="calendar-view reveal-section">
      <div className="cal-toolbar">
        <button type="button" className="cal-nav" onClick={() => nav(-1)} aria-label="Mes anterior">
          <span aria-hidden>←</span>
        </button>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.h2
            key={format(cursor, 'yyyy-MM')}
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -16 : 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {format(cursor, 'MMMM yyyy', { locale: es })}
          </motion.h2>
        </AnimatePresence>
        <button type="button" className="cal-nav" onClick={() => nav(1)} aria-label="Mes siguiente">
          <span aria-hidden>→</span>
        </button>
        <button type="button" className="btn-ghost cal-today-btn" onClick={goToday}>
          Hoy
        </button>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={format(cursor, 'yyyy-MM')}
            className="cal-month-grid"
            custom={dir}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {days.map((day, i) => {
              const key = format(day, 'yyyy-MM-dd')
              const items = byDay.get(key) ?? []
              const inMonth = isSameMonth(day, cursor)
              const today = isSameDay(day, new Date())
              const isOpen = openDay === key
              return (
                <motion.button
                  type="button"
                  key={key}
                  className={`cal-cell${inMonth ? '' : ' is-out'}${today ? ' is-today' : ''}${isOpen ? ' is-open' : ''}${items.length ? ' has-items' : ''}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 20) * 0.012, duration: 0.28 }}
                  onClick={() => setOpenDay(isOpen ? null : key)}
                  aria-label={`${format(day, 'd MMMM', { locale: es })} · ${items.length} tarea(s)`}
                >
                  <span className="cal-daynum">{format(day, 'd')}</span>
                  {today && <span className="cal-today-dot" aria-hidden />}
                  <div className="cal-items">
                    {items.slice(0, 3).map((t) => {
                      const urg = urgencyLevel(t.dueAt, t.status)
                      return (
                        <span
                          key={t.id}
                          className={`cal-chip urg-${urg}`}
                          title={`${t.activity} · ${STATUS_LABELS[t.status]}`}
                        >
                          OT {t.ot}
                        </span>
                      )
                    })}
                    {items.length > 3 && <span className="cal-more">+{items.length - 3} más</span>}
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openDay && openDate && (
          <motion.div
            className="cal-day-drawer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <header>
              <h3>{format(openDate, "EEEE d 'de' MMMM", { locale: es })}</h3>
              <button type="button" className="cal-day-close" onClick={() => setOpenDay(null)} aria-label="Cerrar">
                ×
              </button>
            </header>
            {openItems.length === 0 ? (
              <p className="cal-day-empty">Sin tareas con vencimiento este día.</p>
            ) : (
              <ul className="cal-day-list">
                {openItems.map((t) => {
                  const urg = urgencyLevel(t.dueAt, t.status)
                  return (
                    <li key={t.id}>
                      <button type="button" className={`cal-day-item urg-${urg}`} onClick={() => onOpen(t)}>
                        <span className="cal-day-ot">OT {t.ot}</span>
                        <span className="cal-day-activity">{t.activity}</span>
                        <span className={`status-pill status-${t.status}`}>{STATUS_LABELS[t.status]}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
