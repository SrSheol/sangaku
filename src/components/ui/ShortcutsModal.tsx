import { Modal } from './Modal'

const ROWS = [
  ['/', 'Enfocar búsqueda'],
  ['1', 'Lente: Rollo (temples de urgencia)'],
  ['2', 'Lente: Calendario'],
  ['3', 'Lente: Flujo (kanban)'],
  ['4', 'Lente: Línea de tiempo'],
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
