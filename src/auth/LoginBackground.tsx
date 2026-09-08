import { useEffect, useRef } from 'react'

/** Soft sumi-e geometry: floating circles & arcs (sangaku motifs). */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0

    type Motif = {
      x: number
      y: number
      r: number
      speed: number
      phase: number
      kind: 'circle' | 'arc' | 'tri'
    }

    let motifs: Motif[] = []

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(12, Math.floor((w * h) / 90000))
      motifs = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 18 + Math.random() * 70,
        speed: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        kind: (['circle', 'arc', 'tri'] as const)[Math.floor(Math.random() * 3)],
      }))
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.008
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      // deep ink wash
      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
      g.addColorStop(0, '#1a1612')
      g.addColorStop(0.55, '#12100e')
      g.addColorStop(1, '#0a0908')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      for (const m of motifs) {
        const pulse = 0.5 + 0.5 * Math.sin(t * m.speed + m.phase)
        const alpha = 0.04 + pulse * 0.08
        ctx.strokeStyle = `rgba(201, 162, 39, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        if (m.kind === 'circle') {
          ctx.arc(m.x, m.y + Math.sin(t * m.speed + m.phase) * 6, m.r, 0, Math.PI * 2)
        } else if (m.kind === 'arc') {
          ctx.arc(
            m.x,
            m.y,
            m.r,
            m.phase + t * 0.2,
            m.phase + t * 0.2 + Math.PI * (0.6 + pulse * 0.5),
          )
        } else {
          const y = m.y + Math.cos(t * m.speed) * 4
          ctx.moveTo(m.x, y - m.r * 0.6)
          ctx.lineTo(m.x + m.r * 0.55, y + m.r * 0.45)
          ctx.lineTo(m.x - m.r * 0.55, y + m.r * 0.45)
          ctx.closePath()
        }
        ctx.stroke()

        if (m.kind === 'circle' && pulse > 0.7) {
          ctx.beginPath()
          ctx.arc(m.x, m.y, m.r * 0.35, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(139, 30, 45, ${alpha * 1.4})`
          ctx.stroke()
        }
      }

      // soft crimson vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7)
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(40, 8, 12, 0.45)')
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

  return <canvas ref={canvasRef} className="login-bg" aria-hidden />
}
