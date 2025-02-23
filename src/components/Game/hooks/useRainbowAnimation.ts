import { useEffect, useRef, useMemo } from 'react';

const COLORS = [
    '#86c661', // green
    '#04b3e9', // blue
    '#fbee41', // yellow
    '#f58220', // orange
    '#ef4354'  // red
];

const COLUMNS = 20;
const BASE_DROP_SIZE = 12;
const MAX_Y = 50;

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

interface DropData {
    y: number;
    speed: number;
    size: number;
    color: string;
    x: number;
}

export const useRainbowAnimation = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const lastTimeRef = useRef<number>(0);

    // Create initial drops data - only once
    const initialDrops = useMemo(() => Array(COLUMNS).fill(0).map((_, i) => ({
        y: Math.random() * MAX_Y,
        speed: 0.5 + Math.random() * 1.5,
        size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
        color: getRandomColor(),
        x: i * (480/COLUMNS)
    })), []);

    const dropsRef = useRef<DropData[]>(initialDrops);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!containerRef.current) return;
            
            // Calculate time delta for smooth animation
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            // Update drops positions
            dropsRef.current = dropsRef.current.map(drop => {
                const nextY = drop.y + (drop.speed * delta * 0.06); // Scale speed by delta
                if (nextY > MAX_Y) {
                    return {
                        ...drop,
                        y: 0,
                        speed: 0.5 + Math.random() * 1.5,
                        size: BASE_DROP_SIZE * (0.8 + Math.random() * 0.4),
                        color: getRandomColor()
                    };
                }
                return { ...drop, y: nextY };
            });

            // Update drops transforms
            const drops = containerRef.current.children;
            for (let i = 1; i < drops.length; i++) { // Start at 1 to skip title
                const drop = dropsRef.current[i - 1];
                const stretch = 1 + drop.speed * 0.2;
                const el = drops[i] as HTMLElement;
                el.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) scaleY(${stretch})`;
                el.style.width = `${drop.size}px`;
                el.style.height = `${drop.size}px`;
                if (el.style.backgroundColor !== drop.color) {
                    el.style.backgroundColor = drop.color;
                }
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return {
        containerRef,
        initialDrops
    };
};