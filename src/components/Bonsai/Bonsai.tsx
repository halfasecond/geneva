import React from 'react';
import styled from 'styled-components';

interface BonsaiProps {
    left: number;
    top: number;
    size?: number;
}

const BonsaiImage = styled.img<{ size: number }>`
    position: absolute;
    width: ${props => props.size}px;
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
            src="/svg/horse/Bonsai.svg"
            alt="Bonsai"
            style={{ left, top }}
            size={size}
        />
    );
};

export default Bonsai;