import React from 'react';
import styled from 'styled-components';

interface FlowerProps {
    left: number;
    top: number;
    size?: number;
    rotation?: number;
}

const FlowerImage = styled.img<{ size: number, rotation: number }>`
    position: absolute;
    width: ${props => props.size}px;
    height: auto;
    transform: rotate(${props => props.rotation}deg);
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
            src="/horse/Flower.svg"
            alt="Flower"
            style={{ left, top }}
            size={size}
            rotation={rotation}
        />
    );
};

export default Flower;