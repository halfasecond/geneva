import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../utils/assetPath';
import { getSVG } from 'src/utils/getImage';
import { Z_LAYERS } from 'src/config/zIndex';

interface HorseProps {
    horse: any;
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

export const Horse: React.FC<HorseProps> = ({ horse, style }) => {
    return (
        <HorseContainer style={style}>
            <img src={getSVG(horse.svg)} alt={`Horse #${horse.tokenId}`} />
        </HorseContainer>
    );
};

export default Horse;