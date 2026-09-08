import { useEffect, useRef } from 'react'

/** Soft sumi-e geometry + parallax gold dust layers. */
export function LoginBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      }
      const dx = (pointer.current.x - 0.5) * 24
      const dy = (pointer.current.y - 0.5) * 18
      if (layerRef.current) {
        layerRef.current.style.transform = `translate3d(${dx * 0.35}px, ${dy * 0.35}px, 0)`
      }
      if (dustRef.current) {
        dustRef.current.style.transform = `translate3d(${dx * -0.55}px, ${dy * -0.45}px, 0)`
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

      const count = Math.max(14, Math.floor((w * h) / 85000))
      motifs = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 18 + Math.random() * 75,
        speed: 0.12 + Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2,
        kind: (['circle', 'arc', 'tri'] as const)[Math.floor(Math.random() * 3)],
      }))
    }

    const draw = () => {
      raf = requestAnimationFrame(draw)
      t += 0.008
      const w = window.innerWidth
      const h = window.innerHeight
      const px = (pointer.current.x - 0.5) * 18
      const py = (pointer.current.y - 0.5) * 12

      ctx.clearRect(0, 0, w, h)

      // deep espresso wash
      const g = ctx.createRadialGradient(
        w * 0.5 + px,
        h * 0.32 + py,
        40,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.78,
      )
      g.addColorStop(0, '#1c1912')
      g.addColorStop(0.45, '#12100a')
      g.addColorStop(1, '#0a0801')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      for (const m of motifs) {
        const pulse = 0.5 + 0.5 * Math.sin(t * m.speed + m.phase)
        const alpha = 0.03 + pulse * 0.06
        const ox = m.x + px * 0.4
        const oy = m.y + py * 0.4 + Math.sin(t * m.speed + m.phase) * 5
        ctx.strokeStyle = `rgba(202, 161, 0, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        if (m.kind === 'circle') {
          ctx.arc(ox, oy, m.r, 0, Math.PI * 2)
        } else if (m.kind === 'arc') {
          ctx.arc(
            ox,
            oy,
            m.r,
            m.phase + t * 0.2,
            m.phase + t * 0.2 + Math.PI * (0.6 + pulse * 0.5),
          )
        } else {
          ctx.moveTo(ox, oy - m.r * 0.6)
          ctx.lineTo(ox + m.r * 0.55, oy + m.r * 0.45)
          ctx.lineTo(ox - m.r * 0.55, oy + m.r * 0.45)
          ctx.closePath()
        }
        ctx.stroke()

        if (m.kind === 'circle' && pulse > 0.72) {
          ctx.beginPath()
          ctx.arc(ox, oy, m.r * 0.32, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(202, 161, 0, ${alpha * 1.2})`
          ctx.stroke()
        }
      }

      // warm lacquer vignette
      const vg = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.18,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.72,
      )
      vg.addColorStop(0, 'rgba(0,0,0,0)')
      vg.addColorStop(1, 'rgba(10, 8, 1, 0.55)')
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
      <div ref={layerRef} className="login-parallax login-parallax-geo" aria-hidden />
      <div ref={dustRef} className="login-parallax login-parallax-dust" aria-hidden />
    </>
  )
}
