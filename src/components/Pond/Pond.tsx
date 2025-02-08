import React from 'react';
import { PondContainer } from './Pond.style';

interface PondProps {
    left: number;
    top: number;
}

export const Pond: React.FC<PondProps> = ({ left, top }) => {
    return (
        <PondContainer style={{ left, top }} />
    );
};

export default Pond;