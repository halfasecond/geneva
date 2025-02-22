import React from 'react';
import * as Styled from '../../Game.style';
import { useWaveAnimation } from '../../hooks/useWaveAnimation';

export const Beach: React.FC = () => {
    const { waveRef, style } = useWaveAnimation({ isVisible: true });
    return (
        <div>
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