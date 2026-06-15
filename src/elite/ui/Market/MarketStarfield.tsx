import React, { useEffect, useRef } from 'react'

/** Sparse star backdrop for the market windscreen (matches cartography holo). */
const MarketStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.floor(width))
      const h = Math.max(1, Math.floor(height))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.fillStyle = '#050e15'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
      for (let i = 0; i < 140; i++) {
        const sx = ((i * 97 + 13) % 1000) / 1000 * w
        const sy = ((i * 53 + 7) % 1000) / 1000 * h
        const sr = (i % 3 === 0) ? 1.1 : 0.55
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}

export default MarketStarfield