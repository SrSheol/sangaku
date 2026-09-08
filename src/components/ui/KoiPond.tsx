import { useEffect, useState } from 'react'
import { KoiFish } from './InkAssets'

/**
 * Two ink-brush koi that occasionally drift across the background.
 * Idle ambient life only — always `pointer-events: none`, never
 * intercepts clicks, and freezes entirely when the person prefers
 * reduced motion (either the OS setting or the app's own toggle).
 */
export function KoiPond({ paused = false }: { paused?: boolean }) {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (reduced || paused) return null

  return (
    <div className="koi-pond" aria-hidden>
      <KoiFish className="koi-fish koi-fish-a" />
      <KoiFish className="koi-fish koi-fish-b is-vermillion" />
    </div>
  )
}
