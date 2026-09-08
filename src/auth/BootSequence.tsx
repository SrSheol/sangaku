import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { hasSeenBoot, markBootSeen } from './session'
import { SealMark } from '../components/ui/InkAssets'

interface Props {
  onDone: () => void
}

const DURATION_MS = 3400

export function BootSequence({ onDone }: Props) {
  const [visible, setVisible] = useState(() => !hasSeenBoot())
  const [stage, setStage] = useState(0)
  const finished = useRef(false)

  const finish = () => {
    if (finished.current) return
    finished.current = true
    markBootSeen()
    setVisible(false)
    window.setTimeout(onDone, 700)
  }

  useEffect(() => {
    if (!visible) {
      if (!finished.current) {
        finished.current = true
        onDone()
      }
      return
    }
    const t1 = window.setTimeout(() => setStage(1), 120) // brush strokes draw
    const t2 = window.setTimeout(() => setStage(2), 900) // seal drops
    const t3 = window.setTimeout(() => setStage(3), 1550) // title reveals
    const id = window.setTimeout(finish, DURATION_MS)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
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
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="boot-washi" aria-hidden />
          <div className="grain" aria-hidden />

          <svg className="boot-strokes" viewBox="0 0 400 400" aria-hidden>
            <path
              className={`boot-stroke s1${stage >= 1 ? ' is-drawn' : ''}`}
              d="M60 130 C 140 90, 260 150, 340 100"
              fill="none"
            />
            <path
              className={`boot-stroke s2${stage >= 1 ? ' is-drawn' : ''}`}
              d="M70 280 C 150 320, 250 250, 330 300"
              fill="none"
            />
            <path
              className={`boot-stroke s3${stage >= 1 ? ' is-drawn' : ''}`}
              d="M200 60 C 210 150, 190 250, 200 340"
              fill="none"
            />
          </svg>

          <div className="boot-center">
            <motion.div
              className="boot-seal"
              initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
              animate={
                stage >= 2
                  ? { opacity: 1, scale: 1, rotate: -6 }
                  : { opacity: 0, scale: 2.4, rotate: -14 }
              }
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <SealMark size={92} glyph="算" />
            </motion.div>

            <motion.div
              className="boot-copy"
              initial={{ opacity: 0, y: 14 }}
              animate={stage >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="boot-kanji">算額</p>
              <h1 className="boot-title">Sangaku</h1>
              <p className="boot-tagline">templo silencioso de pendientes</p>
            </motion.div>
          </div>

          <motion.p
            className="boot-skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 1.9, duration: 0.8 }}
          >
            tocar · esc · espacio para continuar
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
