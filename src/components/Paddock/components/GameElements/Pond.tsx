import React from 'react';
import styled from 'styled-components';
import { Z_LAYERS } from '../../../../config/zIndex';

interface PondProps {
    left: number;
    top: number;
}

const PondContainer = styled.div`
    position: absolute;
    width: 500px;
    height: 400px;
    background-color: #37d7ff;
    z-index: ${Z_LAYERS.WATER};
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
`;

const Pond: React.FC<PondProps> = ({ left, top }) => {
    return (
        <PondContainer style={{ left, top }} />
    );
};

export default Pond;