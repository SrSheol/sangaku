import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hasSeenBoot, markBootSeen } from './session'

interface Props {
  onDone: () => void
}

const DURATION_MS = 2200

export function BootSequence({ onDone }: Props) {
  const [visible, setVisible] = useState(() => !hasSeenBoot())
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    markBootSeen()
    setVisible(false)
    window.setTimeout(onDone, 520)
  }

  useEffect(() => {
    if (!visible) {
      if (!finished.current) {
        finished.current = true
        onDone()
      }
      return
    }
    const id = window.setTimeout(finish, DURATION_MS)
    return () => window.clearTimeout(id)
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
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="boot-wash" aria-hidden />
          <div className="grain" aria-hidden />
          <motion.div
            className="boot-seal"
            initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="boot-seal-ring" />
            <span className="boot-seal-kanji">算</span>
          </motion.div>
          <motion.p
            className="boot-title"
            initial={{ opacity: 0, y: 12, letterSpacing: '0.5em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.28em' }}
            transition={{ delay: 0.35, duration: 0.9 }}
          >
            Sangaku <em>算額</em>
          </motion.p>
          <motion.p
            className="boot-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.9 }}
          >
            tocar para continuar
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
