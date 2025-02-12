import styled from 'styled-components';

export const DuckImage = styled.img`
    position: absolute;
    height: auto;
    z-index: 3;
    pointer-events: none;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
    will-change: transform;
    transform: translateZ(0);
`;