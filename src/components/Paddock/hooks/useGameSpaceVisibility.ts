import { useEffect, useRef, useState, useCallback } from 'react';

interface ViewportDimensions {
    width: number;
    height: number;
}

interface ViewportOffset {
    x: number;
    y: number;
}

interface UseGameSpaceVisibilityProps {
    viewportOffset: ViewportOffset;
    viewportDimensions: ViewportDimensions;
}

export const useGameSpaceVisibility = ({ viewportOffset, viewportDimensions }: UseGameSpaceVisibilityProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const lastUpdateRef = useRef<number>(0);
    const UPDATE_INTERVAL = 100; // ms

    const checkVisibility = useCallback(() => {
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect();
            const isInView = (
                rect.bottom >= 0 &&
                rect.top <= viewportDimensions.height &&
                rect.right >= 0 &&
                rect.left <= viewportDimensions.width
            );
            setIsVisible(isInView);
        }
    }, [viewportDimensions]);

    useEffect(() => {
        const now = Date.now();
        if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
            lastUpdateRef.current = now;
            checkVisibility();
        }
    }, [viewportOffset.x, viewportOffset.y, checkVisibility]);

    return {
        elementRef,
        isVisible
    };
};
