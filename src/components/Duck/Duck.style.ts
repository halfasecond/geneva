import styled from 'styled-components';

interface DuckImageProps {
    width?: number;
}

export const DuckImage = styled.img<DuckImageProps>`
    position: absolute;
    width: ${({ width = 120 }) => width}px;
    height: auto;
    transition: transform 0.3s ease;
    z-index: 3;
    pointer-events: none;
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
`;