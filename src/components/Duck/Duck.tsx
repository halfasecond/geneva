import React, { useEffect, useState } from 'react';
import * as Styled from './Duck.style';
import { getAssetPath } from '../../utils/assetPath';

interface DuckProps {
    left: number;
    top: number;
    width?: number;
    pondWidth: number;
}

const Duck: React.FC<DuckProps> = ({ left, top: baseTop, width = 120, pondWidth }) => {
    const [position, setPosition] = useState(left);
    const [direction, setDirection] = useState<'right' | 'left'>('right');
    
    // Generate random speed and height offset only once on mount
    const [speed] = useState(() => 1 + Math.random());
    const [randomTop] = useState(() => baseTop + Math.floor(Math.random() * 100));
    
    useEffect(() => {
        // Each duck gets its own random speed between 1-2px per frame
        const DUCK_SPEED = speed;
        const moveInterval = setInterval(() => {
            setPosition(prev => {
                let next = direction === 'right' ? prev + DUCK_SPEED : prev - DUCK_SPEED;
                
                // Change direction at pond edges
                if (next >= left + pondWidth - width) {
                    next = left + pondWidth - width;
                    setDirection('left');
                    console.log('Duck changing direction to left');
                } else if (next <= left) {
                    next = left;
                    setDirection('right');
                    console.log('Duck changing direction to right');
                }
                
                return next;
            });
        }, 50); // Same interval as horse movement
        
        return () => clearInterval(moveInterval);
    }, [direction, left, pondWidth, width]);

    // Log when position or direction changes
    useEffect(() => {
        console.log('Duck position updated:', { position, direction });
    }, [position, direction]);

    return (
        <Styled.DuckImage
            src={getAssetPath('horse/Duck.svg')}
            alt="Duck"
            style={{
                left: `${position}px`,
                top: `${randomTop}px`,
                transform: `scaleX(${direction === 'right' ? -1 : 1})`  // Reversed to match duck image direction
            }}
            width={width}
        />
    );
};

export default Duck;