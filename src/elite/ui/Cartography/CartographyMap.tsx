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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      sizeRef.current = { w: canvas.width, h: canvas.height }
    }

    resize()
    window.addEventListener('resize', resize)

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
      window.removeEventListener('resize', resize)
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
  )
}

export default CartographyMap