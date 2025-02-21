import { useState, useEffect, useRef, useCallback } from 'react';
import { Position } from '../../../server/types';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../../utils/coordinates';

interface UseViewportProps {
    position: Position | undefined;
    dimensions: {
        width: number;
        height: number;
    };
    minScale?: number;
    maxScale?: number;
    trackMovement?: boolean;
    edgeThreshold?: number;
}

interface ViewportState {
    scale: number;
    offset: { x: number; y: number };
    origin: { x: number; y: number };
}

export function useViewport({
    position,
    dimensions,
    minScale = 0.2,
    maxScale = 1.5,
    trackMovement = false,
    edgeThreshold = 0.2
}: UseViewportProps) {
    // Use refs for values we want to track but not react to
    const stateRef = useRef<ViewportState>({
        scale: 1,
        offset: { x: 0, y: 0 },
        origin: { x: 50, y: 50 }
    });

    // State only for values that should trigger re-renders
    const [viewportState, setViewportState] = useState<ViewportState>({
        scale: 1,
        offset: { x: 0, y: 0 },
        origin: { x: 50, y: 50 }
    });

    // Keep ref in sync with state
    stateRef.current = viewportState;

    // Calculate viewport offset based on position and tracking mode
    const updateViewport = useCallback(() => {
        if (!position || !dimensions.width || !dimensions.height) return;

        const currentState = stateRef.current;
        let newOffset = { ...currentState.offset };

        if (trackMovement) {
            // Directly center on position
            newOffset = {
                x: position.x - (dimensions.width / 2 / currentState.scale),
                y: position.y - (dimensions.height / 2 / currentState.scale)
            };
        } else {
            // Edge-based scrolling
            const scaledWidth = dimensions.width / currentState.scale;
            const scaledHeight = dimensions.height / currentState.scale;
            
            const viewportRight = newOffset.x + scaledWidth;
            const viewportBottom = newOffset.y + scaledHeight;
            
            const rightEdge = viewportRight - (scaledWidth * edgeThreshold);
            const leftEdge = newOffset.x + (scaledWidth * edgeThreshold);
            const bottomEdge = viewportBottom - (scaledHeight * edgeThreshold);
            const topEdge = newOffset.y + (scaledHeight * edgeThreshold);

            if (position.x > rightEdge) {
                newOffset.x = position.x - (scaledWidth * (1 - edgeThreshold));
            } else if (position.x < leftEdge) {
                newOffset.x = position.x - (scaledWidth * edgeThreshold);
            }

            if (position.y > bottomEdge) {
                newOffset.y = position.y - (scaledHeight * (1 - edgeThreshold));
            } else if (position.y < topEdge) {
                newOffset.y = position.y - (scaledHeight * edgeThreshold);
            }
        }

        // Keep within world bounds
        newOffset.x = Math.max(0, Math.min(newOffset.x, WORLD_WIDTH - dimensions.width / currentState.scale));
        newOffset.y = Math.max(0, Math.min(newOffset.y, WORLD_HEIGHT - dimensions.height / currentState.scale));

        // Calculate zoom origin based on position
        const horseViewportX = (position.x - newOffset.x) * currentState.scale;
        const horseViewportY = (position.y - newOffset.y) * currentState.scale;
        const newOrigin = {
            x: (horseViewportX / dimensions.width) * 100,
            y: (horseViewportY / dimensions.height) * 100
        };

        if (
            newOffset.x !== currentState.offset.x ||
            newOffset.y !== currentState.offset.y ||
            newOrigin.x !== currentState.origin.x ||
            newOrigin.y !== currentState.origin.y
        ) {
            setViewportState(prev => ({
                ...prev,
                offset: newOffset,
                origin: newOrigin
            }));
        }
    }, [dimensions.width, dimensions.height, position, trackMovement, edgeThreshold]);

    // Update viewport when position changes
    useEffect(() => {
        updateViewport();
    }, [updateViewport]);

    // Handle zoom keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return;

            if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                const newScale = Math.min(maxScale, stateRef.current.scale + 0.1);
                if (newScale !== stateRef.current.scale) {
                    setViewportState(prev => ({ ...prev, scale: newScale }));
                    // Update viewport after scale change
                    requestAnimationFrame(updateViewport);
                }
            } else if (e.key === '-') {
                e.preventDefault();
                const newScale = Math.max(minScale, stateRef.current.scale - 0.1);
                if (newScale !== stateRef.current.scale) {
                    setViewportState(prev => ({ ...prev, scale: newScale }));
                    // Update viewport after scale change
                    requestAnimationFrame(updateViewport);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [maxScale, minScale, updateViewport]);

    return {
        scale: viewportState.scale,
        offset: viewportState.offset,
        origin: viewportState.origin,
        style: {
            transform: `scale(${viewportState.scale}) translate(${-viewportState.offset.x}px, ${-viewportState.offset.y}px)`,
            transformOrigin: `${viewportState.origin.x}% ${viewportState.origin.y}%`
        }
    };
}