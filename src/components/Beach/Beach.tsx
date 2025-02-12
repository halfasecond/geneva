import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface BeachProps {
    viewportOffset: { x: number; y: number };
    viewportDimensions: { width: number; height: number };
}

const BeachContainer = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 800px;
    z-index: 1;
`;

const Sand = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 800px;
    background: linear-gradient(
        to bottom,
        #f4e4bc,
        #e6d5b1
    );
`;

const Sea = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 420px;
    z-index: 2000;
    overflow: hidden;
    transform: translateZ(0);
`;

const Wave = styled.div`
    position: absolute;
    top: -100px;
    left: -100%;
    width: 400%;
    height: 520px;
    background: linear-gradient(
        to bottom,
        rgba(55, 215, 255, 0.8),
        rgba(55, 215, 255, 0.3),
        rgba(55, 215, 255, 0.8) 66%,
        rgba(55, 215, 255, 0.9)
    );
    border-radius: 50% 50% 0 0;
    transform-origin: center bottom;
    backface-visibility: hidden;
`;

const Beach: React.FC<BeachProps> = ({ viewportOffset, viewportDimensions }) => {
    const [isVisible, setIsVisible] = useState(false);
    const beachRef = useRef<HTMLDivElement>(null);
    const waveRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Check if beach is in viewport
        if (beachRef.current) {
            const beachRect = beachRef.current.getBoundingClientRect();
            const isInView = (
                beachRect.bottom >= 0 &&
                beachRect.top <= viewportDimensions.height &&
                beachRect.right >= 0 &&
                beachRect.left <= viewportDimensions.width
            );
            setIsVisible(isInView);
        }
    }, [viewportOffset.x, viewportOffset.y, viewportDimensions]);

    // Animate wave using requestAnimationFrame
    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = (timestamp - startTimeRef.current) / 8000; // 8s duration
            
            if (waveRef.current && isVisible) {
                const x = -50 * Math.sin(progress * Math.PI);
                const scale = 0.8 + (0.2 * Math.cos(progress * Math.PI));
                waveRef.current.style.transform = `translate3d(${x}%, 0, 0) scaleY(${scale})`;
            }

            if (progress >= 1) {
                startTimeRef.current = timestamp;
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
    }, [isVisible]);

    return (
        <BeachContainer ref={beachRef}>
            <Sand />
            <Sea>
                <Wave 
                    ref={waveRef}
                    style={{
                        willChange: isVisible ? 'transform' : 'auto'
                    }}
                />
            </Sea>
        </BeachContainer>
    );
};

export default Beach;