import { useState, useEffect, useCallback, useRef } from 'react'
import { Position } from '../../../server/types'
import { paths, rivers, isInRiver } from '../components/Environment'
import { isOnPath, getSafeZone } from '../../Bridleway/utils'
import { introMessages } from '../../Bridleway/messages'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../../utils/coordinates'

interface UseMovementProps {
    viewportWidth: number
    viewportHeight: number
    onPositionChange: (position: Position) => void
    introActive?: boolean
    movementDisabled?: boolean
    onMessageTrigger?: (messageIndex: number) => void
    forcePosition?: Position
    racingHorsePosition?: { x: number; y: number }
    serverPosition?: Position  // Position from server actor
}

interface ViewportOffset {
    x: number
    y: number
}

interface UseMovementResult {
    position: Position | undefined
    viewportOffset: ViewportOffset
}

interface MovementState {
    canMove: boolean;      // Can player move at all?
    pathRestricted: boolean;  // Must stay on paths?
    followPlayer: boolean;    // Should viewport follow player?
}

interface PositionState {
    current: Position | undefined;
    lastBroadcast: Position | null;
    frameCount: number;
}

// Horse dimensions and movement
const HORSE_SIZE = 120; // pixels
const MOVEMENT_SPEED = HORSE_SIZE / 32; // Trotting speed: 3.75 pixels per frame = ~225 pixels/second at 60fps

// Viewport thresholds
const EDGE_THRESHOLD = 0.2; // 20% from edges

// Position change detection
const hasPositionChanged = (a: Position | undefined, b: Position | undefined) => {
    if (!a || !b) return false;
    return a.x !== b.x || a.y !== b.y || a.direction !== b.direction;
};

export function useMovement({
    viewportWidth,
    viewportHeight,
    onPositionChange,
    introActive = false,
    movementDisabled = false,
    onMessageTrigger,
    forcePosition,
    racingHorsePosition,
    serverPosition
}: UseMovementProps): UseMovementResult {
    const [position, setPosition] = useState<Position | undefined>(undefined)

    // Update position when server position changes
    useEffect(() => {
        if (serverPosition) {
            setPosition(serverPosition);
        }
    }, [serverPosition]);
    const [viewportOffset, setViewportOffset] = useState<ViewportOffset>({ x: 0, y: 0 })
    const [keys, setKeys] = useState<Set<string>>(new Set())
    
    // Movement state
    const [movementState, setMovementState] = useState<MovementState>({
        canMove: !movementDisabled && Boolean(serverPosition),  // Only allow movement with server position
        pathRestricted: introActive,
        followPlayer: true
    })

    const animationFrameRef = useRef<number>()
    const keysRef = useRef<Set<string>>(new Set())
    keysRef.current = keys

    // Track position state for throttling
    const positionStateRef = useRef<PositionState>({
        current: undefined,
        lastBroadcast: null,
        frameCount: 0
    });

    // Update ref when server position changes
    useEffect(() => {
        if (serverPosition) {
            positionStateRef.current.current = serverPosition;
            positionStateRef.current.lastBroadcast = serverPosition;
        }
    }, [serverPosition]);

    // Update movement state based on props
    useEffect(() => {
        setMovementState({
            canMove: !movementDisabled && !racingHorsePosition && Boolean(serverPosition),  // Need server position
            pathRestricted: introActive && !racingHorsePosition,  // Disable path restrictions during/after race
            followPlayer: !racingHorsePosition  // Follow player unless racing
        });
    }, [movementDisabled, introActive, racingHorsePosition, serverPosition]);

    // Force position update when provided or cleared
    useEffect(() => {
        if (forcePosition) {
            setPosition(forcePosition);
            onPositionChange(forcePosition);
            positionStateRef.current = {
                current: forcePosition,
                lastBroadcast: forcePosition,
                frameCount: 0
            };
        } else if (forcePosition === undefined && racingHorsePosition === undefined) {
            // Race finished - ensure movement state is properly reset
            setMovementState(prevState => ({
                ...prevState,
                canMove: !movementDisabled,
                pathRestricted: introActive
            }));
        }
    }, [forcePosition, racingHorsePosition, movementDisabled, introActive, onPositionChange]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.repeat || !movementState.canMove) return;
        setKeys(prev => new Set(prev).add(e.key))
    }, [movementState.canMove])

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

        // Check path restrictions
        if (movementState.pathRestricted) {
            const pathsWithSafeZones = paths.map(path => ({
                ...path,
                safeZone: getSafeZone(path)
            }))
            if (!isOnPath(horseBox, pathsWithSafeZones)) {
                return false;
            }
        }

        return true;
    }, [movementState.pathRestricted])

    // Calculate new viewport offset based on position
    const calculateViewportOffset = useCallback((pos: Position | undefined): ViewportOffset => {
        if (!viewportWidth || !viewportHeight || !pos) return viewportOffset;

        let newX = viewportOffset.x;
        let newY = viewportOffset.y;

        if (!movementState.followPlayer && racingHorsePosition) {
            // Racing mode - viewport follows race position
            newX = racingHorsePosition.x - (viewportWidth * 0.2);
            newY = racingHorsePosition.y - (viewportHeight * 0.7);
        } else {
            // Normal mode - viewport follows player
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
    }, [viewportWidth, viewportHeight, movementState.followPlayer, racingHorsePosition, viewportOffset]);

    // Handle movement and viewport animation
    useEffect(() => {
        if (!movementState.canMove) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        const updateFrame = () => {
            if (!position) return;  // Don't update if no position yet
            
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
            if (!moved && direction !== position.direction) {
                const newPosition = { ...position, direction };
                setPosition(newPosition);
                positionStateRef.current.current = newPosition;

                // Always broadcast direction changes
                onPositionChange(newPosition);
                positionStateRef.current.lastBroadcast = newPosition;
                return;
            }

            // Keep within bounds
            x = Math.max(0, Math.min(x, WORLD_WIDTH - HORSE_SIZE));
            y = Math.max(0, Math.min(y, WORLD_HEIGHT - HORSE_SIZE));

            // Check if new position is valid
            if (isValidPosition(x, y, direction)) {
                const newPosition = { x, y, direction };
                setPosition(newPosition);
                positionStateRef.current.current = newPosition;

                // Update viewport in the same frame
                const newOffset = calculateViewportOffset(newPosition);
                if (newOffset.x !== viewportOffset.x || newOffset.y !== viewportOffset.y) {
                    setViewportOffset(newOffset);
                }

                // Handle position broadcasting
                positionStateRef.current.frameCount++;
                if (positionStateRef.current.frameCount >= 3) { // Every 3rd frame (~20 updates/sec)
                    const { current, lastBroadcast } = positionStateRef.current;
                    
                    // Broadcast if position changed
                    if (!lastBroadcast || hasPositionChanged(current, lastBroadcast)) {
                        onPositionChange(current);
                        positionStateRef.current.lastBroadcast = { ...current };
                    }
                    
                    positionStateRef.current.frameCount = 0;
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
        movementState.canMove,
        onPositionChange,
        serverPosition
    ]);

    // Handle racing viewport updates
    useEffect(() => {
        if (movementState.followPlayer || !racingHorsePosition || !position) return;

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
    }, [movementState.followPlayer, racingHorsePosition, position, calculateViewportOffset, viewportOffset]);

    // Handle message triggers
    useEffect(() => {
        if (!onMessageTrigger || !introActive || !position) return;

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
