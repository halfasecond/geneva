import { useEffect, useRef, useState } from 'react';

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

    useEffect(() => {
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
    }, [viewportOffset.x, viewportOffset.y, viewportDimensions]);

    return {
        elementRef,
        isVisible
    };
};