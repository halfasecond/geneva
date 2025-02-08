import { useState, useEffect, useCallback } from 'react'
import { Position } from '../../../server/types'
import { paths } from '../../Bridleway/set'
import { isOnPath } from '../../Bridleway/utils'

interface UseMovementProps {
    viewportWidth: number
    viewportHeight: number
    scale: number
    initialPosition: Position
    onPositionChange: (position: Position) => void
    introActive?: boolean
}

interface ViewportOffset {
    x: number
    y: number
}

export function useMovement({ 
    viewportWidth,
    viewportHeight,
    scale,
    initialPosition,
    onPositionChange,
    introActive = false
}: UseMovementProps) {
    const [position, setPosition] = useState<Position>(initialPosition)
    const [viewportOffset, setViewportOffset] = useState<ViewportOffset>({ x: 0, y: 0 })
    const [keys, setKeys] = useState<Set<string>>(new Set())

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.repeat) return // Ignore key repeat events
        setKeys(prev => new Set(prev).add(e.key))
    }, [])

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        setKeys(prev => {
            const next = new Set(prev)
            next.delete(e.key)
            return next
        })
    }, [])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [handleKeyDown, handleKeyUp])

    useEffect(() => {
        let animationFrameId: number

        const updatePosition = () => {
            setPosition(prev => {
                const speed = 5
                let x = prev.x
                let y = prev.y
                let direction = prev.direction
                let moved = false

                // Calculate potential new position
                if (keys.has('ArrowLeft') || keys.has('a')) {
                    x -= speed
                    direction = 'left'
                    moved = true
                }
                if (keys.has('ArrowRight') || keys.has('d')) {
                    x += speed
                    direction = 'right'
                    moved = true
                }
                if (keys.has('ArrowUp') || keys.has('w')) {
                    y -= speed
                    moved = true
                }
                if (keys.has('ArrowDown') || keys.has('s')) {
                    y += speed
                    moved = true
                }

                // If no movement, return previous state
                if (!moved && direction === prev.direction) {
                    return prev
                }

                // If intro is active, validate position against paths
                if (introActive) {
                    const horseBox = {
                        left: x,
                        right: x + 120, // horse width
                        top: y,
                        bottom: y + 120 // horse height
                    }

                    // Add safeZone to each path segment using exact legacy padding values
                    const pathsWithSafeZones = paths.map(path => ({
                        ...path,
                        safeZone: {
                            left: path.left + 90,
                            right: path.left + path.width - 90,
                            top: path.top + 80,
                            bottom: path.top + path.height - 90
                        }
                    }))
                    
                    // Only allow movement if new position is on path
                    if (!isOnPath(horseBox, pathsWithSafeZones)) {
                        // If only direction changed, allow that
                        if (x === prev.x && y === prev.y && direction !== prev.direction) {
                            const newPosition = { ...prev, direction }
                            onPositionChange(newPosition)
                            return newPosition
                        }
                        return prev // Keep previous position if invalid
                    }
                }

                // Position is valid or intro is inactive
                const newPosition = { x, y, direction }
                onPositionChange(newPosition)
                return newPosition
            })

            animationFrameId = requestAnimationFrame(updatePosition)
        }

        if (keys.size > 0) {
            updatePosition()
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [keys, onPositionChange, introActive])

    // Update viewport when horse approaches edges
    useEffect(() => {
        if (viewportWidth > 0 && viewportHeight > 0) {
            const viewportRight = viewportOffset.x + viewportWidth
            const viewportBottom = viewportOffset.y + viewportHeight
            
            // Only scroll if horse is near viewport edges
            let newX = viewportOffset.x
            let newY = viewportOffset.y
            
            // Check if horse is too close to right/left edges
            const rightEdge = viewportRight - (viewportWidth * 0.1)
            const leftEdge = viewportOffset.x + (viewportWidth * 0.1)
            if (position.x > rightEdge) {
                newX = position.x - (viewportWidth * 0.9)
            } else if (position.x < leftEdge) {
                newX = position.x - (viewportWidth * 0.1)
            }
            
            // Same for top/bottom
            const bottomEdge = viewportBottom - (viewportHeight * 0.1)
            const topEdge = viewportOffset.y + (viewportHeight * 0.1)
            if (position.y > bottomEdge) {
                newY = position.y - (viewportHeight * 0.9)
            } else if (position.y < topEdge) {
                newY = position.y - (viewportHeight * 0.1)
            }
            
            // Keep viewport within GameSpace bounds (5000x8000)
            newX = Math.max(0, Math.min(newX, 5000 - viewportWidth))
            newY = Math.max(0, Math.min(newY, 8000 - viewportHeight))
            
            if (newX !== viewportOffset.x || newY !== viewportOffset.y) {
                setViewportOffset({ x: newX, y: newY })
            }
        }
    }, [position.x, position.y, viewportWidth, viewportHeight, viewportOffset])

    return {
        position,
        viewportOffset
    }
}
