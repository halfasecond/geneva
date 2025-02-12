import { useState, useEffect, useRef } from 'react'
import { Position } from '../../../server/types'

interface UseZoomProps {
    minScale?: number
    maxScale?: number
    position: Position
    viewportOffset: { x: number; y: number }
    viewportDimensions: { width: number; height: number }
}

interface ZoomOrigin {
    x: number;
    y: number;
}

export const useZoom = ({
    minScale = 0.2,  // Max zoom out (see whole space)
    maxScale = 1.5,  // Max zoom in
    position,
    viewportOffset,
    viewportDimensions
}: UseZoomProps) => {
    // Use refs for values we want to track but not react to
    const scaleRef = useRef(1)
    const zoomOriginRef = useRef<ZoomOrigin>({ x: 50, y: 50 })
    
    // State only for values that should trigger re-renders
    const [scale, setScale] = useState(1)
    const [zoomOrigin, setZoomOrigin] = useState<ZoomOrigin>({ x: 50, y: 50 })

    // Keep refs in sync with state
    scaleRef.current = scale
    zoomOriginRef.current = zoomOrigin

    // Calculate zoom origin without triggering re-renders
    const updateZoomOrigin = () => {
        if (viewportDimensions.width > 0 && viewportDimensions.height > 0) {
            const horseViewportX = (position.x - viewportOffset.x) * scaleRef.current
            const horseViewportY = (position.y - viewportOffset.y) * scaleRef.current
            const newOrigin = {
                x: (horseViewportX / viewportDimensions.width) * 100,
                y: (horseViewportY / viewportDimensions.height) * 100
            }

            // Only update if values actually changed
            if (newOrigin.x !== zoomOriginRef.current.x || 
                newOrigin.y !== zoomOriginRef.current.y) {
                setZoomOrigin(newOrigin)
            }
        }
    }

    // Update zoom origin when relevant values change
    useEffect(() => {
        updateZoomOrigin()
    }, [
        viewportDimensions.width,
        viewportDimensions.height,
        position.x,
        position.y,
        viewportOffset.x,
        viewportOffset.y
    ]) // Removed scale from dependencies

    // Handle zoom keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return

            if (e.key === '=' || e.key === '+') {
                e.preventDefault()
                const newScale = Math.min(maxScale, scaleRef.current + 0.1)
                if (newScale !== scaleRef.current) {
                    setScale(newScale)
                    // Update zoom origin after scale change
                    requestAnimationFrame(updateZoomOrigin)
                }
            } else if (e.key === '-') {
                e.preventDefault()
                const newScale = Math.max(minScale, scaleRef.current - 0.1)
                if (newScale !== scaleRef.current) {
                    setScale(newScale)
                    // Update zoom origin after scale change
                    requestAnimationFrame(updateZoomOrigin)
                }
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
