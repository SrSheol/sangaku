import type { Preferences } from '../../types'
import { Modal } from './Modal'

export function PreferencesPanel({
  prefs,
  onChange,
  onClose,
  onRequestNotif,
  notifState,
}: {
  prefs: Preferences
  onChange: (p: Preferences) => void
  onClose: () => void
  onRequestNotif: () => void
  notifState: NotificationPermission | 'unsupported'
}) {
  return (
    <Modal title="Preferencias" onClose={onClose}>
      <div className="prefs-grid">
        <label className="toggle">
          <input
            type="checkbox"
            checked={prefs.reduceMotion}
            onChange={(e) => onChange({ ...prefs, reduceMotion: e.target.checked })}
          />
          Reducir movimiento
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={prefs.cursor}
            onChange={(e) => onChange({ ...prefs, cursor: e.target.checked })}
          />
          Cursor personalizado
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={prefs.sound}
            onChange={(e) => onChange({ ...prefs, sound: e.target.checked })}
          />
          Audio ambiental
        </label>
        <label>
          Densidad
          <select
            value={prefs.density}
            onChange={(e) =>
              onChange({
                ...prefs,
                density: e.target.value === 'compact' ? 'compact' : 'comfortable',
              })
            }
          >
            <option value="comfortable">Cómoda</option>
            <option value="compact">Compacta</option>
          </select>
        </label>
        <div className="prefs-notif">
          <p>Recordatorios del navegador</p>
          <button type="button" className="btn-ghost" onClick={onRequestNotif}>
            {notifState === 'granted'
              ? 'Permiso concedido'
              : notifState === 'denied'
                ? 'Permiso denegado'
                : notifState === 'unsupported'
                  ? 'No disponible'
                  : 'Permitir notificaciones'}
          </button>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn-seal btn-seal-sm" onClick={onClose}>
          Listo
        </button>
      </div>
    </Modal>
  )
}
