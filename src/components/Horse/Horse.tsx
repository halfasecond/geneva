import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../utils/assetPath';
import { Z_LAYERS } from 'src/config/zIndex';

interface HorseProps {
    horseId: string;
    style?: React.CSSProperties;
}

const HorseContainer = styled.div`
    width: 100px;
    height: 100px;
    will-change: transform;
    z-index: ${Z_LAYERS.CHARACTERS};

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
            <img src={getAssetPath(`horse/${horseId}.svg`)} alt={`Horse #${horseId}`} />
        </HorseContainer>
    );
};

export default Horse;