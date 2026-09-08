import { useEffect, useRef } from 'react'

/** Soft temple-like drone via Web Audio — OFF by default, no asset files. */
export function useAmbientAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])

  useEffect(() => {
    if (!enabled) {
      for (const n of nodesRef.current) {
        try {
          n.osc.stop()
        } catch {
          // already stopped
        }
      }
      nodesRef.current = []
      if (ctxRef.current) {
        void ctxRef.current.close()
        ctxRef.current = null
      }
      return
    }

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ctxRef.current = ctx

    const freqs = [110, 164.81, 220]
    const nodes: { osc: OscillatorNode; gain: GainNode }[] = []
    for (const f of freqs) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.value = 0.012
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      nodes.push({ osc, gain })
    }
    nodesRef.current = nodes

    const resume = () => {
      if (ctx.state === 'suspended') void ctx.resume()
    }
    window.addEventListener('pointerdown', resume, { once: true })

    return () => {
      window.removeEventListener('pointerdown', resume)
      for (const n of nodes) {
        try {
          n.osc.stop()
        } catch {
          // ignore
        }
      }
      void ctx.close()
      ctxRef.current = null
      nodesRef.current = []
    }
  }, [enabled])
}
