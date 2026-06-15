import React, { useEffect, useRef } from 'react'
import { WINDSCREEN, Z } from '../../config'

/**
 * Hyperspace tunnel projected onto the cockpit windscreen (the forward view),
 * not the dashboard / bezel chrome. Sits above cartography, below radar & Vech.
 */
const HyperspaceTunnel: React.FC = () => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t0 = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(wrap.clientWidth))
      const h = Math.max(1, Math.floor(wrap.clientHeight))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const streaks = Array.from({ length: 88 }, () => ({
      x: (Math.random() - 0.5) * 2.2,
      y: (Math.random() - 0.5) * 2.2,
      z: Math.random(),
      speed: 0.4 + Math.random() * 0.65,
      len: 0.1 + Math.random() * 0.18,
    }))

    const draw = (now: number) => {
      const elapsed = (now - t0) / 1000
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      const cx = w * 0.5
      const cy = h * 0.5
      const spread = Math.max(w, h) * 0.58

      ctx.fillStyle = `rgba(2, 8, 16, ${0.3 + Math.min(0.3, elapsed * 0.1)})`
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
      ro.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        top: WINDSCREEN.top,
        left: WINDSCREEN.left,
        right: WINDSCREEN.right,
        bottom: WINDSCREEN.bottom,
        zIndex: Z.hyperspace,
        overflow: 'hidden',
        pointerEvents: 'none',
        border: `1px solid ${WINDSCREEN.border}`,
        boxShadow: WINDSCREEN.innerGlow,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}

export default HyperspaceTunnel