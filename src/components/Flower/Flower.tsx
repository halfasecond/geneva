import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../utils/assetPath';

interface FlowerProps {
    left: number;
    top: number;
    size?: number;
    rotation?: number;
}

const FlowerImage = styled.img`
    position: absolute;
    height: auto;
    pointer-events: none;
    z-index: 1;
`;

const Flower: React.FC<FlowerProps> = ({ 
    left, 
    top, 
    size = 150,
    rotation = 0
}) => {
    return (
        <FlowerImage
            src={getAssetPath('horse/Flower.svg')}
            alt="Flower"
            style={{
                left,
                top,
                width: `${size}px`,
                transform: `rotate(${rotation}deg)`
            }}
        />
    );
};

export default Flower;