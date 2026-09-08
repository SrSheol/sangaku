import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CATEGORY_LABELS, STATUS_LABELS, STATUSES } from '../../lib/constants'
import { formatDay } from '../../lib/dates'
import {
  idbAddComment,
  idbGetComments,
  idbGetHistory,
  newCommentId,
} from '../../lib/db'
import type { Task, TaskComment, TaskHistoryEntry, TaskStatus } from '../../types'

const HISTORY_LABELS: Record<string, string> = {
  status: 'Estado',
  notes: 'Notas',
  edit: 'Edición',
  created: 'Creada',
  import: 'Importación',
}

export function TaskDetail({
  task,
  readOnly,
  onClose,
  onStatus,
  onSaveNotes,
}: {
  task: Task
  readOnly?: boolean
  onClose: () => void
  onStatus: (s: TaskStatus) => void
  onSaveNotes: (notes: string) => void
}) {
  const [tab, setTab] = useState<'info' | 'history' | 'comments'>('info')
  const [notes, setNotes] = useState(task.notes ?? '')
  const [history, setHistory] = useState<TaskHistoryEntry[]>([])
  const [comments, setComments] = useState<TaskComment[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setNotes(task.notes ?? '')
    void idbGetHistory(task.id).then(setHistory)
    void idbGetComments(task.id).then(setComments)
  }, [task.id, task.notes, task.status, task.updatedAt])

  const addComment = async () => {
    if (readOnly || !draft.trim()) return
    const c: TaskComment = {
      id: newCommentId(),
      taskId: task.id,
      at: new Date().toISOString(),
      text: draft.trim(),
      by: 'Sheol',
    }
    await idbAddComment(c)
    setComments((prev) => [...prev, c])
    setDraft('')
  }

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <motion.aside
        className="task-drawer glass-panel"
        role="dialog"
        aria-modal
        aria-label="Detalle de tarea"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <p className="drawer-kicker">OT {task.ot} · {CATEGORY_LABELS[task.category]}</p>
            <h2>{task.activity}</h2>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="drawer-tabs">
          {(['info', 'history', 'comments'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={tab === t ? 'is-active' : ''}
              onClick={() => setTab(t)}
            >
              {t === 'info' ? 'Info' : t === 'history' ? 'Historial' : 'Comentarios'}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="drawer-body">
            <div className="meta-row">
              <span className="meta-label">Estado</span>
              {readOnly ? (
                <span>{STATUS_LABELS[task.status]}</span>
              ) : (
                <select value={task.status} onChange={(e) => onStatus(e.target.value as TaskStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="meta-row">
              <span className="meta-label">Vence</span>
              <span>{formatDay(task.dueAt)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Asignada</span>
              <span>{formatDay(task.assignedAt)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Asignó</span>
              <span>{task.assigner}</span>
            </div>
            <label className="drawer-notes">
              Notas
              <textarea
                rows={4}
                value={notes}
                disabled={readOnly}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            {!readOnly && (
              <button
                type="button"
                className="btn-seal btn-seal-sm"
                onClick={() => onSaveNotes(notes.trim())}
              >
                Guardar notas
              </button>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="drawer-body">
            {history.length === 0 ? (
              <p className="empty-hint">Sin cambios registrados aún.</p>
            ) : (
              <ul className="history-list">
                {history.map((h) => (
                  <li key={h.id}>
                    <strong>{HISTORY_LABELS[h.kind] ?? h.kind}</strong>
                    <span>
                      {h.from && h.to ? `${h.from} → ${h.to}` : h.to || '—'}
                    </span>
                    <em>
                      {new Date(h.at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} · {h.by}
                    </em>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="drawer-body">
            {comments.length === 0 ? (
              <p className="empty-hint">Sin comentarios.</p>
            ) : (
              <ul className="comment-list">
                {comments.map((c) => (
                  <li key={c.id}>
                    <p>{c.text}</p>
                    <em>
                      {c.by} ·{' '}
                      {new Date(c.at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
                    </em>
                  </li>
                ))}
              </ul>
            )}
            {!readOnly && (
              <div className="comment-compose">
                <textarea
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe un comentario…"
                />
                <button type="button" className="btn-seal btn-seal-sm" onClick={() => void addComment()}>
                  Publicar
                </button>
              </div>
            )}
          </div>
        )}
      </motion.aside>
    </div>
  )
}
