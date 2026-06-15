import React, { useEffect, useRef } from 'react'
import { WINDSCREEN, Z } from '../../config'

/** 2D windscreen tunnel rush — visible fallback layered over the 3D streaks. */
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
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width))
      canvas.height = Math.max(1, Math.floor(rect.height))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const streaks = Array.from({ length: 48 }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(),
      speed: 0.35 + Math.random() * 0.55,
      len: 0.08 + Math.random() * 0.14,
    }))

    const draw = (now: number) => {
      const elapsed = (now - t0) / 1000
      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.46

      ctx.fillStyle = 'rgba(5, 14, 21, 0.22)'
      ctx.fillRect(0, 0, w, h)

      streaks.forEach(s => {
        s.z -= s.speed * 0.016
        if (s.z < 0.02) {
          s.x = (Math.random() - 0.5) * 2
          s.y = (Math.random() - 0.5) * 2
          s.z = 1
        }
        const inv = 1 / Math.max(0.08, s.z)
        const sx = cx + s.x * inv * w * 0.34
        const sy = cy + s.y * inv * h * 0.34
        const ex = cx + s.x * inv * w * 0.34 * (1 - s.len)
        const ey = cy + s.y * inv * h * 0.34 * (1 - s.len)
        const alpha = Math.min(0.95, inv * 0.12 + elapsed * 0.05)

        ctx.strokeStyle = `rgba(170, 230, 255, ${alpha})`
        ctx.lineWidth = Math.min(3, inv * 0.8)
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: WINDSCREEN.top,
        left: WINDSCREEN.left,
        right: WINDSCREEN.right,
        bottom: WINDSCREEN.bottom,
        width: 'auto',
        height: 'auto',
        zIndex: Z.cartography + 1,
        pointerEvents: 'none',
      }}
    />
  )
}

export default HyperspaceTunnel