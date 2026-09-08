import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hasSeenBoot, markBootSeen } from './session'

interface Props {
  onDone: () => void
}

const DURATION_MS = 2800

export function BootSequence({ onDone }: Props) {
  const [visible, setVisible] = useState(() => !hasSeenBoot())
  const [lineDrawn, setLineDrawn] = useState(false)
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    markBootSeen()
    setVisible(false)
    window.setTimeout(onDone, 600)
  }

  useEffect(() => {
    if (!visible) {
      if (!finished.current) {
        finished.current = true
        onDone()
      }
      return
    }
    const lineId = window.setTimeout(() => setLineDrawn(true), 280)
    const id = window.setTimeout(finish, DURATION_MS)
    return () => {
      window.clearTimeout(lineId)
      window.clearTimeout(id)
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="boot-sequence"
          role="presentation"
          onClick={finish}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="boot-wash" aria-hidden />
          <div className="grain" aria-hidden />
          <motion.p
            className="boot-kanji"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.92, y: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            和
          </motion.p>
          <div className={`boot-line${lineDrawn ? ' is-drawn' : ''}`} aria-hidden />
          <motion.p
            className="boot-title"
            initial={{ opacity: 0, y: 10, letterSpacing: '0.55em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.42em' }}
            transition={{ delay: 0.45, duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          >
            Sangaku <em>算額</em>
          </motion.p>
          <motion.p
            className="boot-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            tocar para continuar
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
