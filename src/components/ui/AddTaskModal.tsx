import { useState } from 'react'
import { CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, STATUSES } from '../../lib/constants'
import type { Task, TaskCategory, TaskStatus } from '../../types'
import { Modal } from './Modal'

export function AddTaskModal({
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
