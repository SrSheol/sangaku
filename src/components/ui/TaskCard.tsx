import { motion } from 'framer-motion'
import { STATUS_LABELS, STATUSES } from '../../lib/constants'
import { formatDay, urgencyLevel, daysUntilDue } from '../../lib/dates'
import type { Task, TaskStatus } from '../../types'

const STAGGER_LIMIT = 18

export function TaskCard({
  task,
  index,
  readOnly,
  density,
  dueSoonBadge,
  onStatus,
  onDone,
  onOpen,
}: {
  task: Task
  index: number
  readOnly?: boolean
  density?: 'comfortable' | 'compact'
  dueSoonBadge?: boolean
  onStatus: (s: TaskStatus) => void
  onDone: () => void
  onOpen: () => void
}) {
  const urg = urgencyLevel(task.dueAt, task.status)
  const days = daysUntilDue(task.dueAt)
  const stagger = index < STAGGER_LIMIT ? index * 0.028 : 0
  const done = task.status === 'completada'
  const compact = density === 'compact'

  return (
    <motion.article
      className={`task-card urg-${urg}${done ? ' is-done' : ''}${readOnly ? ' is-readonly' : ''}${compact ? ' is-compact' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stagger, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      whileHover={readOnly ? undefined : { y: -2, transition: { duration: 0.25 } }}
    >
      <div className="card-main" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
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
          {dueSoonBadge && urg === 'soon' && <span className="remind-badge">Pronto</span>}
          {urg === 'overdue' && !done && <span className="remind-badge overdue">Vencida</span>}
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
                  {days < 0 ? `${Math.abs(days)}d vencida` : days === 0 ? 'hoy' : `${days}d`}
                </em>
              )}
            </span>
          </div>
          {!compact && (
            <>
              <div className="meta-row">
                <span className="meta-label">Asignó</span>
                <span>{task.assigner}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Asignada</span>
                <span>{formatDay(task.assignedAt)}</span>
              </div>
            </>
          )}
        </div>
        {task.notes && !compact && <p className="notes-preview">{task.notes}</p>}
      </div>
      {!readOnly && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
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
          <button type="button" className="btn-ghost" onClick={onOpen}>
            Detalle
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
