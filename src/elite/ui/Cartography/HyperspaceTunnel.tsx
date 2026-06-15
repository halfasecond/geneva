import React, { useEffect, useRef } from 'react'
import { Z } from '../../config'

/**
 * Full-viewport translucent hyperspace holo — washes over the 3D scene but sits
 * beneath all cockpit chrome (dashboard, radar, Vech, bezels) via z-index.
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

    const streaks = Array.from({ length: 96 }, () => ({
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
      const spread = Math.max(w, h) * 0.62

      // Light translucent wash — cockpit UI on higher z-index shows through
      ctx.fillStyle = `rgba(2, 10, 20, ${0.12 + Math.min(0.18, elapsed * 0.06)})`
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
        const alpha = Math.min(0.55, inv * 0.08 + elapsed * 0.04)

        ctx.strokeStyle = `rgba(170, 225, 255, ${alpha})`
        ctx.lineWidth = Math.min(3.5, 0.5 + inv * 0.85)
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
        inset: 0,
        zIndex: Z.hyperspace,
        overflow: 'hidden',
        pointerEvents: 'none',
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