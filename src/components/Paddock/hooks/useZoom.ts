import { useState, useEffect } from 'react'
import { Position } from '../../../server/types'

interface UseZoomProps {
    minScale?: number
    maxScale?: number
    position: Position
    viewportOffset: { x: number; y: number }
    viewportDimensions: { width: number; height: number }
}

export const useZoom = ({
    minScale = 0.2,  // Max zoom out (see whole space)
    maxScale = 1.5,  // Max zoom in
    position,
    viewportOffset,
    viewportDimensions
}: UseZoomProps) => {
    const [scale, setScale] = useState(1)
    const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 }) // Center by default

    // Update zoom origin when viewport dimensions change
    useEffect(() => {
        if (viewportDimensions.width > 0 && viewportDimensions.height > 0) {
            const horseViewportX = (position.x - viewportOffset.x) * scale
            const horseViewportY = (position.y - viewportOffset.y) * scale
            setZoomOrigin({
                x: (horseViewportX / viewportDimensions.width) * 100,
                y: (horseViewportY / viewportDimensions.height) * 100
            })
        }
    }, [viewportDimensions.width, viewportDimensions.height, position, viewportOffset, scale])

    // Listen for Ctrl+/- keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return

            if (e.key === '=' || e.key === '+') {
                e.preventDefault()
                setScale(current => Math.min(maxScale, current + 0.1))
            } else if (e.key === '-') {
                e.preventDefault()
                setScale(current => Math.max(minScale, current - 0.1))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [maxScale, minScale])

    return {
        scale,
        zoomOrigin
    }
}
