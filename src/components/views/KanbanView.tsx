import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { STATUS_LABELS, STATUSES } from '../../lib/constants'
import { urgencyLevel } from '../../lib/dates'
import type { Task, TaskStatus } from '../../types'

const COL_GLYPH: Record<TaskStatus, string> = {
  asignada: '待',
  en_proceso: '進',
  completada: '完',
  cancelada: '止',
}

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
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<TaskStatus | null>(null)

  return (
    <div className="kanban-view reveal-section">
      {STATUSES.map((status, colIndex) => {
        const col = tasks.filter((t) => t.status === status)
        const isOver = overCol === status
        return (
          <motion.section
            key={status}
            className={`kanban-col status-${status}${isOver ? ' is-over' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: colIndex * 0.05, duration: 0.3 }}
          >
            <header>
              <span className="kanban-glyph" aria-hidden>
                {COL_GLYPH[status]}
              </span>
              <h3>{STATUS_LABELS[status]}</h3>
              <motion.span
                key={col.length}
                className="count"
                initial={{ scale: 1.3, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                {col.length}
              </motion.span>
            </header>
            <div
              className="kanban-drop"
              onDragOver={(e) => {
                if (readOnly) return
                e.preventDefault()
                if (overCol !== status) setOverCol(status)
              }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={(e) => {
                if (readOnly) return
                e.preventDefault()
                setOverCol(null)
                const id = e.dataTransfer.getData('text/task-id')
                if (id) onStatus(id, status)
              }}
            >
              <AnimatePresence mode="popLayout">
                {col.length === 0 ? (
                  <motion.p
                    key="empty"
                    className="kanban-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <span aria-hidden>◌</span>
                    Vacío
                  </motion.p>
                ) : (
                  col.map((t) => {
                    const urg = urgencyLevel(t.dueAt, t.status)
                    return (
                      <motion.article
                        key={t.id}
                        layout
                        layoutId={t.id}
                        className={`kanban-card urg-${urg}${draggingId === t.id ? ' is-dragging' : ''}`}
                        draggable={!readOnly}
                        initial={{ opacity: 0, scale: 0.94, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92 }}
                        whileHover={{ y: -2 }}
                        whileDrag={{ scale: 1.03, rotate: -1 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        onDragStart={(e) => {
                          const evt = e as unknown as React.DragEvent
                          evt.dataTransfer?.setData('text/task-id', t.id)
                          setDraggingId(t.id)
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() => onOpen(t)}
                      >
                        <span className="ot-badge">OT {t.ot}</span>
                        <h4>{t.activity}</h4>
                        <p>{t.dueAt.slice(0, 10)}</p>
                      </motion.article>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )
      })}
    </div>
  )
}
