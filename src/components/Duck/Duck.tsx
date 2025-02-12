import React, { useEffect, useRef, useMemo } from 'react';
import * as Styled from './Duck.style';
import { getAssetPath } from '../../utils/assetPath';

interface DuckProps {
    left: number;
    top: number;
    width?: number;
    pondWidth: number;
}

const Duck: React.FC<DuckProps> = ({ left, top: baseTop, width = 120, pondWidth }) => {
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const positionRef = useRef(left);
    const directionRef = useRef<'right' | 'left'>('right');
    
    // Generate random speed and height offset only once
    const speed = useMemo(() => 1 + Math.random(), []);
    const randomTop = useMemo(() => baseTop + Math.floor(Math.random() * 100), [baseTop]);
    
    // Use ref for the element to avoid unnecessary re-renders
    const duckRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const animate = (timestamp: number) => {
            // Calculate time delta for smooth animation
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Update position based on delta time
            const DUCK_SPEED = speed * (delta * 0.06); // Scale speed by delta
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
            if (duckRef.current) {
                const scaleX = directionRef.current === 'right' ? -1 : 1;
                duckRef.current.style.transform = 
                    `translate3d(${nextPosition}px, ${randomTop}px, 0) scaleX(${scaleX})`;
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [left, pondWidth, width, speed, randomTop]);

    return (
        <Styled.DuckImage
            ref={duckRef}
            src={getAssetPath('horse/Duck.svg')}
            alt="Duck"
            style={{
                transform: `translate3d(${left}px, ${randomTop}px, 0) scaleX(1)`,
                width: `${width}px`
            }}
        />
    );
};

export default Duck;