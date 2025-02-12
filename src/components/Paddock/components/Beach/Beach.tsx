import React from 'react';
import * as Styled from '../../Paddock.style';
import { useGameSpaceVisibility } from '../../hooks/useGameSpaceVisibility';
import { useWaveAnimation } from '../../hooks/useWaveAnimation';

interface BeachProps {
    viewportOffset: { x: number; y: number };
    viewportDimensions: { width: number; height: number };
}

export const Beach: React.FC<BeachProps> = ({ viewportOffset, viewportDimensions }) => {
    const { elementRef, isVisible } = useGameSpaceVisibility({
        viewportOffset,
        viewportDimensions
    });
    const { waveRef, style } = useWaveAnimation({ isVisible });

    return (
        <div ref={elementRef}>
            <Styled.Sand />
            <Styled.Sea>
                <Styled.Wave 
                    ref={waveRef}
                    style={style}
                />
            </Styled.Sea>
        </div>
    );
};