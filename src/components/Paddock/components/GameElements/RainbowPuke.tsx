import React from 'react';
import styled from 'styled-components';
import { Z_LAYERS } from '../../../../config/zIndex';
import { useRainbowAnimation } from '../../hooks/useRainbowAnimation';

interface RainbowPukeProps {
    top: number;
    left: number;
}

const Container = styled.div`
    position: absolute;
    width: 480px;  // Almost full pond width
    height: 340px;  // Match pond height
    border-radius: 8px;  // Match pond style
    overflow: hidden;  // Contain drops within bounds
    z-index: ${Z_LAYERS.EFFECTS};
    left: 10px;  // Center in pond
    transform: translateZ(0);  // Force GPU acceleration
    will-change: transform;  // Hint for browser optimization
`;

const Title = styled.h2`
    position: absolute;
    margin-top: -20px;
    opacity: 0.4;
    font-size: 14px;
    white-space: nowrap;
`;

const Drop = styled.div`
    position: absolute;
    will-change: transform;
    transform: translateZ(0);
`;

const RainbowPuke: React.FC<RainbowPukeProps> = ({ top, left }) => {
    const { containerRef, initialDrops } = useRainbowAnimation();

    return (
        <div style={{ position: 'absolute', top, left }}>
            <Title>RainbowPuke Falls</Title>
            <Container ref={containerRef}>
                {initialDrops.map((drop, i) => (
                    <Drop
                        key={i}
                        style={{
                            width: `${drop.size}px`,
                            height: `${drop.size}px`,
                            transform: `translate3d(${drop.x}px, ${drop.y}px, 0)`,
                            backgroundColor: drop.color
                        }}
                    />
                ))}
            </Container>
        </div>
    );
};

export default RainbowPuke;