import React, { useEffect, useRef } from 'react'
import {
  drawCartographyFrame,
  mapScaleForViewport,
  pickCartographyDestination,
} from '../../render/cartographyMap'
import type { CartographyRoute } from '../../render/cartographyMap'

interface CartographyMapProps {
  route: CartographyRoute
  playerPos: { x: number; y: number }
  onDestinationPick: (destinationId: string) => void
}

const CartographyMap: React.FC<CartographyMapProps> = ({ route, playerPos, onDestinationPick }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect()
      const w = Math.max(1, Math.floor(width))
      const h = Math.max(1, Math.floor(height))
      canvas.width = w
      canvas.height = h
      sizeRef.current = { w, h }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    let mapTime = 0
    const draw = () => {
      mapTime += 0.016
      const { w, h } = sizeRef.current
      if (w && h) {
        drawCartographyFrame(ctx, w, h, mapTime, route, playerPos)
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      ro.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [route, playerPos])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2
    const scale = mapScaleForViewport(canvas.width, canvas.height)
    const picked = pickCartographyDestination(mx, my, scale)
    if (picked) onDestinationPick(picked)
  }

  return (
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: 'crosshair',
        }}
      />
    </div>
  )
}

export default CartographyMap