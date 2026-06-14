/**
 * useHoloDrag
 * Deduplicates the three almost-identical draggable holo panel implementations
 * (map, route controls, flight info).
 *
 * Usage in orchestrator or panel:
 *   const drag = useHoloDrag(mapPanelPos, setMapPanelPos, { maxXPad: 480, maxYPad: 420 })
 *   <div onMouseDown={drag.startDrag} ... >
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface DragOptions {
  minX?: number
  maxXPad?: number
  minY?: number
  maxYPad?: number
}

const DEFAULTS: Required<DragOptions> = {
  minX: 10,
  maxXPad: 480,
  minY: 10,
  maxYPad: 420,
}

export function useHoloDrag(
  pos: { x: number; y: number },
  setPos: (p: { x: number; y: number }) => void,
  options: DragOptions = {}
) {
  const opts = { ...DEFAULTS, ...options }
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)

  const startDrag = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    dragRef.current = {
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
    }
    e.preventDefault()
  }, [pos.x, pos.y])

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const newX = Math.max(opts.minX, Math.min(window.innerWidth - opts.maxXPad, e.clientX - dragRef.current.offsetX))
    const newY = Math.max(opts.minY, Math.min(window.innerHeight - opts.maxYPad, e.clientY - dragRef.current.offsetY))
    setPos({ x: newX, y: newY })
  }, [opts.minX, opts.maxXPad, opts.minY, opts.maxYPad, setPos])

  const stopDrag = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  // Global listeners only while dragging (exact behavior from original)
  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', stopDrag, { once: true })
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [isDragging, handleDragMove, stopDrag])

  return { startDrag, handleDragMove, stopDrag, isDragging }
}
