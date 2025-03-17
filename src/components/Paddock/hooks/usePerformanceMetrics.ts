import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
    fps: number;
    latency: number;
    updateFrequency: number;
    serverResponseTime: number;
}

export function usePerformanceMetrics() {
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        fps: 0,
        latency: 0,
        updateFrequency: 0,
        serverResponseTime: 0
    });

    const frameCountRef = useRef(0);
    const lastFrameTimeRef = useRef(performance.now());
    const updateCountRef = useRef(0);
    const lastUpdateTimeRef = useRef(performance.now());
    const pingTimesRef = useRef<number[]>([]);

    // Track FPS
    useEffect(() => {
        let animationFrameId: number;
        
        const measureFPS = (timestamp: number) => {
            frameCountRef.current++;
            
            const elapsed = timestamp - lastFrameTimeRef.current;
            if (elapsed >= 1000) { // Update every second
                const fps = Math.round((frameCountRef.current * 1000) / elapsed);
                setMetrics(prev => ({ ...prev, fps }));
                
                frameCountRef.current = 0;
                lastFrameTimeRef.current = timestamp;
            }
            
            animationFrameId = requestAnimationFrame(measureFPS);
        };
        
        animationFrameId = requestAnimationFrame(measureFPS);
        
        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Track movement update frequency
    const trackMovementUpdate = () => {
        updateCountRef.current++;
        const now = performance.now();
        const elapsed = now - lastUpdateTimeRef.current;
        
        if (elapsed >= 1000) { // Update every second
            const frequency = Math.round((updateCountRef.current * 1000) / elapsed);
            setMetrics(prev => ({ ...prev, updateFrequency: frequency }));
            
            updateCountRef.current = 0;
            lastUpdateTimeRef.current = now;
        }
    };

    // Track server response time
    const trackServerResponse = (responseTime: number) => {
        pingTimesRef.current.push(responseTime);
        if (pingTimesRef.current.length > 10) {
            pingTimesRef.current.shift();
        }
        
        const avgResponseTime = Math.round(
            pingTimesRef.current.reduce((a, b) => a + b, 0) / pingTimesRef.current.length
        );
        
        setMetrics(prev => ({ ...prev, serverResponseTime: avgResponseTime }));
    };

    // Track WebSocket latency
    const trackLatency = (latency: number) => {
        setMetrics(prev => ({ ...prev, latency }));
    };

    return {
        metrics,
        trackMovementUpdate,
        trackServerResponse,
        trackLatency
    };
}