import { useState, useEffect, useCallback, useRef } from 'react'
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
    // Use refs for values we want to track but not react to
    const positionRef = useRef<Position>(initialPosition)
    const viewportOffsetRef = useRef<ViewportOffset>({ x: 0, y: 0 })
    
    // State only for values that should trigger re-renders
    const [position, setPosition] = useState<Position>(initialPosition)
    const [viewportOffset, setViewportOffset] = useState<ViewportOffset>({ x: 0, y: 0 })
    const [keys, setKeys] = useState<Set<string>>(new Set())
    const [hasFinishedRace, setHasFinishedRace] = useState(false)

    // Keep refs in sync with state
    positionRef.current = position
    viewportOffsetRef.current = viewportOffset

    // Force position update when provided
    useEffect(() => {
        if (forcePosition) {
            setPosition(forcePosition);
            onPositionChange(forcePosition);
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

    // Check if a position is valid
    const isValidPosition = useCallback((x: number, y: number, direction: 'left' | 'right'): boolean => {
        const horseBox = {
            left: x,
            right: x + HORSE_SIZE,
            top: y,
            bottom: y + HORSE_SIZE
        }

        // Check river collision
        if (isInRiver(horseBox, rivers)) {
            return false;
        }

        // Check path restrictions during intro
        if (introActive) {
            const pathsWithSafeZones = paths.map(path => ({
                ...path,
                safeZone: getSafeZone(path)
            }))
            if (!isOnPath(horseBox, pathsWithSafeZones)) {
                return false;
            }
        }

        return true;
    }, [introActive])

    // Handle movement animation
    useEffect(() => {
        if (movementDisabled || forcePosition) return;

        let animationFrameId: number;
        const updatePosition = () => {
            const current = positionRef.current;
            let x = current.x;
            let y = current.y;
            let direction = current.direction;
            let moved = false;

            // Calculate potential new position
            if (keys.has('ArrowLeft') || keys.has('a')) {
                x -= MOVEMENT_SPEED;
                direction = 'left';
                moved = true;
            }
            if (keys.has('ArrowRight') || keys.has('d')) {
                x += MOVEMENT_SPEED;
                direction = 'right';
                moved = true;
            }
            if (keys.has('ArrowUp') || keys.has('w')) {
                y -= MOVEMENT_SPEED;
                moved = true;
            }
            if (keys.has('ArrowDown') || keys.has('s')) {
                y += MOVEMENT_SPEED;
                moved = true;
            }

            // If no movement or only direction change
            if (!moved) {
                if (direction !== current.direction) {
                    const newPosition = { ...current, direction };
                    setPosition(newPosition);
                    onPositionChange(newPosition);
                }
                return;
            }

            // Keep within bounds
            x = Math.max(0, Math.min(x, WORLD_WIDTH - HORSE_SIZE));
            y = Math.max(0, Math.min(y, WORLD_HEIGHT - HORSE_SIZE));

            // Check if new position is valid
            if (isValidPosition(x, y, direction)) {
                const newPosition = { x, y, direction };
                setPosition(newPosition);
                onPositionChange(newPosition);
            }

            animationFrameId = requestAnimationFrame(updatePosition);
        };

        if (keys.size > 0) {
            animationFrameId = requestAnimationFrame(updatePosition);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [keys, isValidPosition, movementDisabled, forcePosition, onPositionChange]);

    // Update viewport offset
    useEffect(() => {
        if (!viewportWidth || !viewportHeight) return;

        let newX = viewportOffsetRef.current.x;
        let newY = viewportOffsetRef.current.y;

        if (movementDisabled && racingHorsePosition) {
            newX = racingHorsePosition.x - (viewportWidth * 0.2);
            newY = racingHorsePosition.y - (viewportHeight * 0.7);
        } else {
            const viewportRight = viewportOffsetRef.current.x + viewportWidth;
            const viewportBottom = viewportOffsetRef.current.y + viewportHeight;
            
            const rightEdge = viewportRight - (viewportWidth * EDGE_THRESHOLD);
            const leftEdge = viewportOffsetRef.current.x + (viewportWidth * EDGE_THRESHOLD);
            if (positionRef.current.x > rightEdge) {
                newX = positionRef.current.x - (viewportWidth * (1 - EDGE_THRESHOLD));
            } else if (positionRef.current.x < leftEdge) {
                newX = positionRef.current.x - (viewportWidth * EDGE_THRESHOLD);
            }
            
            const bottomEdge = viewportBottom - (viewportHeight * EDGE_THRESHOLD);
            const topEdge = viewportOffsetRef.current.y + (viewportHeight * EDGE_THRESHOLD);
            if (positionRef.current.y > bottomEdge) {
                newY = positionRef.current.y - (viewportHeight * (1 - EDGE_THRESHOLD));
            } else if (positionRef.current.y < topEdge) {
                newY = positionRef.current.y - (viewportHeight * EDGE_THRESHOLD);
            }
        }
        
        newX = Math.max(0, Math.min(newX, WORLD_WIDTH - viewportWidth));
        newY = Math.max(0, Math.min(newY, WORLD_HEIGHT - viewportHeight));

        if (newX !== viewportOffsetRef.current.x || newY !== viewportOffsetRef.current.y) {
            setViewportOffset({ x: newX, y: newY });
        }
    }, [position, viewportWidth, viewportHeight, movementDisabled, racingHorsePosition]);

    // Handle message triggers
    useEffect(() => {
        if (!onMessageTrigger || !introActive) return;

        const pathsWithSafeZones = paths.map(path => ({
            ...path,
            safeZone: getSafeZone(path)
        }));

        const horseBox = {
            left: position.x,
            right: position.x + HORSE_SIZE,
            top: position.y,
            bottom: position.y + HORSE_SIZE
        };

        pathsWithSafeZones.forEach((path, index) => {
            const message = introMessages.find(msg => msg.triggerSegment === index);
            if (message && isOnPath(horseBox, [path])) {
                onMessageTrigger(introMessages.indexOf(message));
            }
        });
    }, [position, introActive, onMessageTrigger]);

    return {
        position,
        viewportOffset
    }
}
