import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../../../utils/assetPath';
import { Z_LAYERS } from '../../../../config/zIndex';

interface BonsaiProps {
    left: number;
    top: number;
    size?: number;
}

const BonsaiImage = styled.img`
    position: absolute;
    height: auto;
    pointer-events: none;
    z-index: ${Z_LAYERS.TERRAIN_FEATURES};
`;

const Bonsai: React.FC<BonsaiProps> = ({ 
    left, 
    top, 
    size = 200
}) => {
    return (
        <BonsaiImage
            src={getAssetPath('svg/horse/Bonsai.svg')}
            alt="Bonsai"
            style={{
                left,
                top,
                width: `${size}px`
            }}
        />
    );
};

export default Bonsai;