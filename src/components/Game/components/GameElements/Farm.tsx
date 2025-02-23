import React from 'react';
import styled from 'styled-components';
import { getAssetPath } from '../../../../utils/assetPath';
import { Z_LAYERS } from '../../../../config/zIndex';

interface FarmProps {
    left: number;
    top: number;
    size?: number;
}

const Container = styled.div`
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: ${Z_LAYERS.TERRAIN_FEATURES}
    opacity: 0.6;
`;

const FarmImage = styled.img`
    pointer-events: none;
`;

const Title = styled.div`
    color: #333;
    font-size: 24px;
    margin-top: 10px;
    font-weight: bold;
`;

const Farm: React.FC<FarmProps> = ({ 
    left, 
    top, 
    size = 100
}) => {
    return (
        <Container style={{ left, top }}>
            <FarmImage
                src={getAssetPath('svg/farm.svg')}
                alt="Farm"
                style={{
                    width: `${size}px`,
                    height: `${size}px`
                }}
            />
            <Title>Engagement Farm</Title>
        </Container>
    );
};

export default Farm;