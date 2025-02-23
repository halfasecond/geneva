import { useEffect, useRef } from 'react';

interface UseWaveAnimationProps {
    isVisible: boolean;
}

export const useWaveAnimation = ({ isVisible }: UseWaveAnimationProps) => {
    const waveRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>(0);

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

    return {
        waveRef,
        style: {
            willChange: isVisible ? 'transform' : 'auto'
        }
    };
};