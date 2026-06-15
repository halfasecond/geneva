import React, { useEffect, useRef } from 'react'
import { Z } from '../../config'

/** Full-viewport hyperspace tunnel rush (2D overlay — reliable across GPUs). */
const HyperspaceTunnel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t0 = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const streaks = Array.from({ length: 96 }, () => ({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 2.2,
      z: Math.random(),
      speed: 0.4 + Math.random() * 0.65,
      len: 0.1 + Math.random() * 0.18,
    }))

    const draw = (now: number) => {
      const elapsed = (now - t0) / 1000
      const w = window.innerWidth
      const h = window.innerHeight
      const cx = w * 0.5
      const cy = h * 0.5
      const spread = Math.max(w, h) * 0.62

      ctx.fillStyle = `rgba(2, 8, 16, ${0.28 + Math.min(0.35, elapsed * 0.12)})`
      ctx.fillRect(0, 0, w, h)

      streaks.forEach(s => {
        s.z -= s.speed * 0.018
        if (s.z < 0.02) {
          s.x = (Math.random() - 0.5) * 2.2
          s.y = (Math.random() - 0.5) * 2.2
          s.z = 1
        }
        const inv = 1 / Math.max(0.06, s.z)
        const scale = spread * inv
        const sx = cx + s.x * scale
        const sy = cy + s.y * scale
        const tail = 1 - s.len
        const ex = cx + s.x * scale * tail
        const ey = cy + s.y * scale * tail
        const alpha = Math.min(0.98, inv * 0.14 + elapsed * 0.06)

        ctx.strokeStyle = `rgba(190, 235, 255, ${alpha})`
        ctx.lineWidth = Math.min(4.5, 0.6 + inv * 1.1)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: Z.bezel - 1,
        pointerEvents: 'none',
      }}
    />
  )
}

export default HyperspaceTunnel