import { useEffect, useRef } from 'react';

interface UseDuckAnimationProps {
    isVisible: boolean;
    left: number;
    pondWidth: number;
    width: number;
}

export const useDuckAnimation = ({ isVisible, left, pondWidth, width }: UseDuckAnimationProps) => {
    const duckRef = useRef<HTMLImageElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const positionRef = useRef(left);
    const directionRef = useRef<'right' | 'left'>('right');
    const speedRef = useRef(1 + Math.random());

    useEffect(() => {
        const animate = (timestamp: number) => {
            // Calculate time delta for smooth animation
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Update position based on delta time
            const DUCK_SPEED = speedRef.current * (delta * 0.06); // Scale speed by delta
            let nextPosition = directionRef.current === 'right' 
                ? positionRef.current + DUCK_SPEED 
                : positionRef.current - DUCK_SPEED;
            
            // Change direction at pond edges
            if (nextPosition >= left + pondWidth - width) {
                nextPosition = left + pondWidth - width;
                directionRef.current = 'left';
            } else if (nextPosition <= left) {
                nextPosition = left;
                directionRef.current = 'right';
            }
            
            positionRef.current = nextPosition;

            // Update transform directly for better performance
            if (duckRef.current && isVisible) {
                const scaleX = directionRef.current === 'right' ? -1 : 1;
                duckRef.current.style.transform = 
                    `translate3d(${nextPosition}px, 0, 0) scaleX(${scaleX})`;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        if (isVisible) {
            animationRef.current = requestAnimationFrame(animate);
        }
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isVisible, left, pondWidth, width]);

    return {
        duckRef,
        style: {
            willChange: isVisible ? 'transform' : 'auto'
        }
    };
};