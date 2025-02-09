import React from 'react';
import styled from 'styled-components';

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
    z-index: 1;
    opacity: 0.6;
`;

const FarmImage = styled.img<{ size: number }>`
    width: ${props => props.size}px;
    height: ${props => props.size}px;
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
                src="/svg/farm.svg"
                alt="Farm"
                size={size}
            />
            <Title>Engagement Farm</Title>
        </Container>
    );
};

export default Farm;