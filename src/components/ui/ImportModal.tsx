import { useState } from 'react'
import { mergeImportedRows, parseImportFile } from '../../lib/importTasks'
import type { Task } from '../../types'
import { Modal } from './Modal'

export function ImportModal({
  existing,
  meta,
  onClose,
  onImported,
}: {
  existing: Task[]
  meta: { collaborator: string; badge: string }
  onClose: () => void
  onImported: (tasks: Task[], msg: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const rows = await parseImportFile(file)
      const { tasks, added, updated } = mergeImportedRows(existing, rows, meta)
      onImported(tasks, `Importación: ${added} nuevas · ${updated} actualizadas`)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Importar CSV / Excel" onClose={onClose}>
      <p className="empty-hint">
        Fusiona por <strong>id</strong> u <strong>OT</strong>. Columnas sugeridas: id, ot, activity,
        status, category, assigner, assignedAt, dueAt, notes.
      </p>
      <label className="import-drop">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          disabled={busy}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <span>{busy ? 'Procesando…' : 'Elegir archivo .csv / .xlsx'}</span>
      </label>
      {error && <div className="error-box">{error}</div>}
      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </Modal>
  )
}
