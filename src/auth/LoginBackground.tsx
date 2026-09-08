import { useEffect, useRef } from 'react'

/**
 * Ink diffusing in water: soft overlapping blooms drifting slowly,
 * plus a few hairline "kintsugi" cracks of gold. No geometric grid —
 * this reads as sumi-e wash, not a tech dashboard backdrop.
 */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
      const dx = (pointer.current.x - 0.5) * 18
      const dy = (pointer.current.y - 0.5) * 14
      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(${dx * 0.3}px, ${dy * 0.3}px, 0)`
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0

    type Bloom = {
      x: number
      y: number
      r: number
      speed: number
      phase: number
      drift: number
    }

    let blooms: Bloom[] = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(5, Math.floor((w * h) / 260000))
      blooms = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 160 + Math.random() * 260,
        speed: 0.05 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 0.6,
      }))
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.006
      const w = window.innerWidth
      const h = window.innerHeight
      const px = (pointer.current.x - 0.5) * 30
      const py = (pointer.current.y - 0.5) * 22

      // washi paper base
      ctx.fillStyle = '#efe7d3'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'multiply'
      for (const b of blooms) {
        const ox = b.x + Math.sin(t * b.speed + b.phase) * 40 * b.drift + px * 0.15
        const oy = b.y + Math.cos(t * b.speed * 0.8 + b.phase) * 30 * b.drift + py * 0.15
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, b.r)
        g.addColorStop(0, 'rgba(20, 17, 12, 0.10)')
        g.addColorStop(0.55, 'rgba(20, 17, 12, 0.05)')
        g.addColorStop(1, 'rgba(20, 17, 12, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(ox, oy, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      // deep vignette pulling toward ink at the edges
      const vg = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.75)
      vg.addColorStop(0, 'rgba(11, 9, 6, 0)')
      vg.addColorStop(1, 'rgba(11, 9, 6, 0.78)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="login-bg" aria-hidden />
      <div ref={layerRef} className="login-parallax login-parallax-crack" aria-hidden>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M8 92 L22 70 L18 48 L34 30 L30 8" fill="none" stroke="var(--gold)" strokeWidth="0.25" opacity="0.4" />
          <path d="M96 10 L82 26 L88 44 L74 60 L80 94" fill="none" stroke="var(--gold)" strokeWidth="0.2" opacity="0.3" />
        </svg>
      </div>
    </>
  )
}
