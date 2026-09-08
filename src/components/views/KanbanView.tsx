import { STATUS_LABELS, STATUSES } from '../../lib/constants'
import { urgencyLevel } from '../../lib/dates'
import type { Task, TaskStatus } from '../../types'

export function KanbanView({
  tasks,
  readOnly,
  onStatus,
  onOpen,
}: {
  tasks: Task[]
  readOnly?: boolean
  onStatus: (id: string, s: TaskStatus) => void
  onOpen: (task: Task) => void
}) {
  return (
    <div className="kanban-view reveal-section">
      {STATUSES.map((status) => {
        const col = tasks.filter((t) => t.status === status)
        return (
          <section key={status} className="kanban-col">
            <header>
              <h3>{STATUS_LABELS[status]}</h3>
              <span className="count">{col.length}</span>
            </header>
            <div
              className="kanban-drop"
              onDragOver={(e) => {
                if (readOnly) return
                e.preventDefault()
              }}
              onDrop={(e) => {
                if (readOnly) return
                e.preventDefault()
                const id = e.dataTransfer.getData('text/task-id')
                if (id) onStatus(id, status)
              }}
            >
              {col.length === 0 ? (
                <p className="empty-hint">Vacío</p>
              ) : (
                col.map((t) => {
                  const urg = urgencyLevel(t.dueAt, t.status)
                  return (
                    <article
                      key={t.id}
                      className={`kanban-card urg-${urg}`}
                      draggable={!readOnly}
                      onDragStart={(e) => e.dataTransfer.setData('text/task-id', t.id)}
                      onClick={() => onOpen(t)}
                    >
                      <span className="ot-badge">OT {t.ot}</span>
                      <h4>{t.activity}</h4>
                      <p>{t.dueAt.slice(0, 10)}</p>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
