import { useState, useEffect, useCallback } from 'react'
import { Position } from '../../../server/types'
import { paths } from '../../Bridleway/set'
import { rivers, isInRiver } from '../../Rivers'
import { isOnPath, getSafeZone } from '../../Bridleway/utils'
import { introMessages } from '../../Bridleway/messages'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../../utils/coordinates'

interface UseMovementProps {
    viewportWidth: number
    viewportHeight: number
    initialPosition: Position
    onPositionChange: (position: Position) => void
    introActive?: boolean
    movementDisabled?: boolean
    onMessageTrigger?: (messageIndex: number) => void
    forcePosition?: Position
    racingHorsePosition?: { x: number; y: number }
}

interface ViewportOffset {
    x: number
    y: number
}

// Horse dimensions and movement
const HORSE_SIZE = 120; // pixels
const MOVEMENT_SPEED = HORSE_SIZE / 32; // Trotting speed: 3.75 pixels per frame = ~225 pixels/second at 60fps

// Viewport thresholds
const EDGE_THRESHOLD = 0.2; // 20% from edges

export function useMovement({
    viewportWidth,
    viewportHeight,
    initialPosition,
    onPositionChange,
    introActive = false,
    movementDisabled = false,
    onMessageTrigger,
    forcePosition,
    racingHorsePosition
}: UseMovementProps) {
    const [position, setPosition] = useState<Position>(initialPosition)
    const [viewportOffset, setViewportOffset] = useState<ViewportOffset>({ x: 0, y: 0 })
    const [keys, setKeys] = useState<Set<string>>(new Set())
    const [hasFinishedRace, setHasFinishedRace] = useState(false)

    // Force position update when provided
    useEffect(() => {
        if (forcePosition) {
            setPosition(forcePosition);
            onPositionChange(forcePosition);
            // If position is at finish line, mark race as finished
            if (forcePosition.x >= 1990) {
                setHasFinishedRace(true);
            }
        }
    }, [forcePosition, onPositionChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.repeat || movementDisabled) return;
        setKeys(prev => new Set(prev).add(e.key))
    }, [movementDisabled])

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
            if (movementDisabled || forcePosition) return;

            setPosition(prev => {
                let x = prev.x
                let y = prev.y
                let direction = prev.direction
                let moved = false

                // Calculate potential new position
                if (keys.has('ArrowLeft') || keys.has('a')) {
                    x -= MOVEMENT_SPEED
                    direction = 'left'
                    moved = true
                }
                if (keys.has('ArrowRight') || keys.has('d')) {
                    x += MOVEMENT_SPEED
                    direction = 'right'
                    moved = true
                }
                if (keys.has('ArrowUp') || keys.has('w')) {
                    y -= MOVEMENT_SPEED
                    moved = true
                }
                if (keys.has('ArrowDown') || keys.has('s')) {
                    y += MOVEMENT_SPEED
                    moved = true
                }

                // If no movement, return previous state
                if (!moved && direction === prev.direction) {
                    return prev
                }

                // Keep horse within game bounds
                x = Math.max(0, Math.min(x, WORLD_WIDTH - HORSE_SIZE));
                y = Math.max(0, Math.min(y, WORLD_HEIGHT - HORSE_SIZE));

                const horseBox = {
                    left: x,
                    right: x + HORSE_SIZE,
                    top: y,
                    bottom: y + HORSE_SIZE
                }

                // Check for river collision first
                if (isInRiver(horseBox, rivers)) {
                    // If only direction changed, allow that
                    if (x === prev.x && y === prev.y && direction !== prev.direction) {
                        const newPosition = { ...prev, direction }
                        onPositionChange(newPosition)
                        return newPosition
                    }
                    return prev // Keep previous position if in river
                }

                // Add safeZone to each path segment
                const pathsWithSafeZones = paths.map(path => ({
                    ...path,
                    safeZone: getSafeZone(path)
                }))
                
                // If intro is active, validate position against paths
                if (introActive && !isOnPath(horseBox, pathsWithSafeZones)) {
                    // If only direction changed, allow that
                    if (x === prev.x && y === prev.y && direction !== prev.direction) {
                        const newPosition = { ...prev, direction }
                        onPositionChange(newPosition)
                        return newPosition
                    }
                    return prev // Keep previous position if not on path
                }

                // Check for message triggers
                if (onMessageTrigger) {
                    pathsWithSafeZones.forEach((path, index) => {
                        const message = introMessages.find(msg => msg.triggerSegment === index)
                        if (message && isOnPath(horseBox, [path])) {
                            onMessageTrigger(introMessages.indexOf(message))
                        }
                    })
                }

                // Position is valid
                const newPosition = { x, y, direction }
                onPositionChange(newPosition)
                return newPosition
            })

            animationFrameId = requestAnimationFrame(updatePosition)
        }

        if (keys.size > 0) {
            animationFrameId = requestAnimationFrame(updatePosition)
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [keys, onPositionChange, introActive, onMessageTrigger, movementDisabled, forcePosition, hasFinishedRace])

    // Update viewport when horse approaches edges
    useEffect(() => {
        if (viewportWidth > 0 && viewportHeight > 0) {
            let newX = viewportOffset.x;
            let newY = viewportOffset.y;

            if (movementDisabled && racingHorsePosition) {
                // During race: directly track racing horse position
                newX = racingHorsePosition.x - (viewportWidth * 0.2);  // 20% from left
                newY = racingHorsePosition.y - (viewportHeight * 0.7);  // 70% from top
            } else {
                // Normal gameplay: use edge detection for smooth scrolling
                const viewportRight = viewportOffset.x + viewportWidth;
                const viewportBottom = viewportOffset.y + viewportHeight;
                
                // Check if horse is too close to right/left edges
                const rightEdge = viewportRight - (viewportWidth * EDGE_THRESHOLD);
                const leftEdge = viewportOffset.x + (viewportWidth * EDGE_THRESHOLD);
                if (position.x > rightEdge) {
                    newX = position.x - (viewportWidth * (1 - EDGE_THRESHOLD));
                } else if (position.x < leftEdge) {
                    newX = position.x - (viewportWidth * EDGE_THRESHOLD);
                }
                
                // Same threshold for top/bottom
                const bottomEdge = viewportBottom - (viewportHeight * EDGE_THRESHOLD);
                const topEdge = viewportOffset.y + (viewportHeight * EDGE_THRESHOLD);
                if (position.y > bottomEdge) {
                    newY = position.y - (viewportHeight * (1 - EDGE_THRESHOLD));
                } else if (position.y < topEdge) {
                    newY = position.y - (viewportHeight * EDGE_THRESHOLD);
                }
            }
            
            // Keep viewport within GameSpace bounds
            newX = Math.max(0, Math.min(newX, WORLD_WIDTH - viewportWidth));
            newY = Math.max(0, Math.min(newY, WORLD_HEIGHT - viewportHeight));
            
            if (newX !== viewportOffset.x || newY !== viewportOffset.y) {
                setViewportOffset({ x: newX, y: newY });
            }
        }
    }, [position.x, position.y, viewportWidth, viewportHeight, viewportOffset, movementDisabled, racingHorsePosition])

    return {
        position,
        viewportOffset
    }
}
