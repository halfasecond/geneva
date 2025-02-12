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

interface UseMovementResult {
    position: Position
    viewportOffset: ViewportOffset
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
}: UseMovementProps): UseMovementResult {
    const [position, setPosition] = useState<Position>(initialPosition)
    const [viewportOffset, setViewportOffset] = useState<ViewportOffset>({ x: 0, y: 0 })
    const [keys, setKeys] = useState<Set<string>>(new Set())
    const [hasFinishedRace, setHasFinishedRace] = useState(false)

    const animationFrameRef = useRef<number>()
    const keysRef = useRef<Set<string>>(new Set())
    keysRef.current = keys

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

        // Check path restrictions during intro (but not after race)
        if (introActive && !hasFinishedRace) {
            const pathsWithSafeZones = paths.map(path => ({
                ...path,
                safeZone: getSafeZone(path)
            }))
            if (!isOnPath(horseBox, pathsWithSafeZones)) {
                return false;
            }
        }

        return true;
    }, [introActive, hasFinishedRace])

    // Calculate new viewport offset based on position
    const calculateViewportOffset = useCallback((pos: Position): ViewportOffset => {
        if (!viewportWidth || !viewportHeight) return viewportOffset;

        let newX = viewportOffset.x;
        let newY = viewportOffset.y;

        if (movementDisabled && racingHorsePosition) {
            newX = racingHorsePosition.x - (viewportWidth * 0.2);
            newY = racingHorsePosition.y - (viewportHeight * 0.7);
        } else {
            const viewportRight = viewportOffset.x + viewportWidth;
            const viewportBottom = viewportOffset.y + viewportHeight;
            
            const rightEdge = viewportRight - (viewportWidth * EDGE_THRESHOLD);
            const leftEdge = viewportOffset.x + (viewportWidth * EDGE_THRESHOLD);
            if (pos.x > rightEdge) {
                newX = pos.x - (viewportWidth * (1 - EDGE_THRESHOLD));
            } else if (pos.x < leftEdge) {
                newX = pos.x - (viewportWidth * EDGE_THRESHOLD);
            }
            
            const bottomEdge = viewportBottom - (viewportHeight * EDGE_THRESHOLD);
            const topEdge = viewportOffset.y + (viewportHeight * EDGE_THRESHOLD);
            if (pos.y > bottomEdge) {
                newY = pos.y - (viewportHeight * (1 - EDGE_THRESHOLD));
            } else if (pos.y < topEdge) {
                newY = pos.y - (viewportHeight * EDGE_THRESHOLD);
            }
        }
        
        newX = Math.max(0, Math.min(newX, WORLD_WIDTH - viewportWidth));
        newY = Math.max(0, Math.min(newY, WORLD_HEIGHT - viewportHeight));

        return { x: newX, y: newY };
    }, [viewportWidth, viewportHeight, movementDisabled, racingHorsePosition, viewportOffset]);

    // Handle movement and viewport animation
    useEffect(() => {
        if (movementDisabled || forcePosition) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        const updateFrame = () => {
            const activeKeys = keysRef.current;
            let x = position.x;
            let y = position.y;
            let direction = position.direction;
            let moved = false;

            // Calculate potential new position
            if (activeKeys.has('ArrowLeft') || activeKeys.has('a')) {
                x -= MOVEMENT_SPEED;
                direction = 'left';
                moved = true;
            }
            if (activeKeys.has('ArrowRight') || activeKeys.has('d')) {
                x += MOVEMENT_SPEED;
                direction = 'right';
                moved = true;
            }
            if (activeKeys.has('ArrowUp') || activeKeys.has('w')) {
                y -= MOVEMENT_SPEED;
                moved = true;
            }
            if (activeKeys.has('ArrowDown') || activeKeys.has('s')) {
                y += MOVEMENT_SPEED;
                moved = true;
            }

            // If no movement or only direction change
            if (!moved) {
                if (direction !== position.direction) {
                    const newPosition = { ...position, direction };
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

                // Update viewport in the same frame
                const newOffset = calculateViewportOffset(newPosition);
                if (newOffset.x !== viewportOffset.x || newOffset.y !== viewportOffset.y) {
                    setViewportOffset(newOffset);
                }
            }

            if (activeKeys.size > 0) {
                animationFrameRef.current = requestAnimationFrame(updateFrame);
            }
        };

        if (keys.size > 0) {
            animationFrameRef.current = requestAnimationFrame(updateFrame);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [
        keys,
        position,
        viewportOffset,
        isValidPosition,
        calculateViewportOffset,
        movementDisabled,
        forcePosition,
        onPositionChange
    ]);

    // Handle racing viewport updates
    useEffect(() => {
        if (!movementDisabled || !racingHorsePosition) return;

        const updateRacingViewport = () => {
            const newOffset = calculateViewportOffset(position);
            if (newOffset.x !== viewportOffset.x || newOffset.y !== viewportOffset.y) {
                setViewportOffset(newOffset);
            }
            animationFrameRef.current = requestAnimationFrame(updateRacingViewport);
        };

        animationFrameRef.current = requestAnimationFrame(updateRacingViewport);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [movementDisabled, racingHorsePosition, position, calculateViewportOffset, viewportOffset]);

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
    }, [position.x, position.y, introActive, onMessageTrigger]);

    return {
        position,
        viewportOffset
    }
}
