import { Position } from '../server/types';

// Game world dimensions (matching GameSpace)
export const WORLD_WIDTH = 8000;
export const WORLD_HEIGHT = 5000;

// Minimap dimensions
export const MINIMAP_WIDTH = 300;
export const MINIMAP_HEIGHT = (MINIMAP_WIDTH * WORLD_HEIGHT) / WORLD_WIDTH; // Maintain aspect ratio (will be square)

export interface Vector2D {
    x: number;
    y: number;
}

export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * Coordinate transformation service for handling conversions between
 * world space and minimap space
 */
export class CoordinateTransformer {
    /**
     * Convert world coordinates to minimap coordinates
     */
    static worldToMinimap(worldPos: Vector2D, scale: number = 1): Vector2D {
        return {
            x: ((worldPos.x / WORLD_WIDTH) * MINIMAP_WIDTH) * scale,
            y: ((worldPos.y / WORLD_HEIGHT) * MINIMAP_HEIGHT) * scale
        };
    }

    /**
     * Convert minimap coordinates to world coordinates
     */
    static minimapToWorld(minimapPos: Vector2D): Vector2D {
        return {
            x: (minimapPos.x / MINIMAP_WIDTH) * WORLD_WIDTH,
            y: (minimapPos.y / MINIMAP_HEIGHT) * WORLD_HEIGHT
        };
    }

    /**
     * Convert a world space rectangle to minimap space
     */
    static worldRectToMinimap(worldRect: Rect): Rect {
        return {
            left: (worldRect.left / WORLD_WIDTH) * MINIMAP_WIDTH,
            top: (worldRect.top / WORLD_HEIGHT) * MINIMAP_HEIGHT,
            width: (worldRect.width / WORLD_WIDTH) * MINIMAP_WIDTH,
            height: (worldRect.height / WORLD_HEIGHT) * MINIMAP_HEIGHT
        };
    }

    /**
     * Calculate viewport rectangle in minimap space
     */
    static getViewportRect(viewportOffset: Vector2D, viewportDimensions: { width: number; height: number }, scale: number): Rect {
        return {
            left: (viewportOffset.x / WORLD_WIDTH) * MINIMAP_WIDTH,
            top: (viewportOffset.y / WORLD_HEIGHT) * MINIMAP_HEIGHT,
            width: (viewportDimensions.width / (scale * WORLD_WIDTH)) * MINIMAP_WIDTH,
            height: (viewportDimensions.height / (scale * WORLD_HEIGHT)) * MINIMAP_HEIGHT
        };
    }

    /**
     * Check if a world position is within the viewport
     */
    static isInViewport(worldPos: Vector2D, viewportOffset: Vector2D, viewportDimensions: { width: number; height: number }, scale: number): boolean {
        const viewportRight = viewportOffset.x + (viewportDimensions.width / scale);
        const viewportBottom = viewportOffset.y + (viewportDimensions.height / scale);

        return worldPos.x >= viewportOffset.x &&
               worldPos.x <= viewportRight &&
               worldPos.y >= viewportOffset.y &&
               worldPos.y <= viewportBottom;
    }

    /**
     * Convert a Position object to Vector2D
     */
    static positionToVector(position: Position): Vector2D {
        return {
            x: position.x,
            y: position.y
        };
    }
}