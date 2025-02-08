import React from 'react';
import styled from 'styled-components';

interface HorseProps {
    horseId: string;
    style?: React.CSSProperties;
}

const HorseContainer = styled.div`
    width: 100px;
    height: 100px;
    will-change: transform;
    z-index: 2;

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        mix-blend-mode: multiply;  // This helps with white backgrounds in SVGs
    }
`;

export const Horse: React.FC<HorseProps> = ({ horseId, style }) => {
    return (
        <HorseContainer style={style}>
            <img src={`/horse/${horseId}.svg`} alt={`Horse #${horseId}`} />
        </HorseContainer>
    );
};

export default Horse;