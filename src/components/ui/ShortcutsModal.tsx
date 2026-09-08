import { Modal } from './Modal'

const ROWS = [
  ['/', 'Enfocar búsqueda'],
  ['1', 'Vista lista'],
  ['2', 'Vista calendario'],
  ['3', 'Vista kanban'],
  ['4', 'Vista línea de tiempo'],
  ['?', 'Mostrar atajos'],
  ['Esc', 'Cerrar paneles'],
]

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Atajos" onClose={onClose}>
      <ul className="shortcuts-list">
        {ROWS.map(([k, label]) => (
          <li key={k}>
            <kbd>{k}</kbd>
            <span>{label}</span>
          </li>
        ))}
      </ul>
      <div className="modal-actions">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
