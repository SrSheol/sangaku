import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className={`modal glass-panel${wide ? ' modal-wide' : ''}`}
        role="dialog"
        aria-modal
        aria-label={title}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{title}</h2>
        {children}
      </motion.div>
    </div>
  )
}
