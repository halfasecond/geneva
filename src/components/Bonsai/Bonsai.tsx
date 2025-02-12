import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../utils/assetPath';

interface BonsaiProps {
    left: number;
    top: number;
    size?: number;
}

const BonsaiImage = styled.img`
    position: absolute;
    height: auto;
    pointer-events: none;
    z-index: 1;
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