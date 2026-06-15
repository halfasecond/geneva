import React, { useEffect, useRef } from 'react'
import { MAP } from '../../config'
import { drawCartographyFrame, pickCartographyDestination } from '../../render/cartographyMap'
import type { CartographyRoute } from '../../render/cartographyMap'

interface CartographyMapProps {
  route: CartographyRoute
  playerPos: { x: number; y: number }
  onDestinationPick: (destinationId: string) => void
}

const CartographyMap: React.FC<CartographyMapProps> = ({ route, playerPos, onDestinationPick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const size = MAP.canvasSize
    canvas.width = size
    canvas.height = size

    let mapTime = 0
    const draw = () => {
      mapTime += 0.016
      drawCartographyFrame(ctx, size, mapTime, route, playerPos)
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [route, playerPos])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * canvas.width - canvas.width / 2
    const my = ((e.clientY - rect.top) / rect.height) * canvas.height - canvas.height / 2
    const picked = pickCartographyDestination(mx, my)
    if (picked) onDestinationPick(picked)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      width={MAP.canvasSize}
      height={MAP.canvasSize}
      style={{
        border: `1px solid ${MAP.canvasBorder}`,
        background: MAP.canvasBg,
        cursor: 'crosshair',
        boxShadow: MAP.canvasGlow,
      }}
    />
  )
}

export default CartographyMap