import styled, { keyframes } from 'styled-components'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../utils/coordinates'

export const Container = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: rgb(170, 255, 207);
    z-index: 0;
`

export const GameSpace = styled.div`
    position: absolute;
    width: ${WORLD_WIDTH}px;
    height: ${WORLD_HEIGHT}px;
    transition: transform 0.1s ease-out;
    will-change: transform;
`

export const BeachSand = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 800px;
    background: linear-gradient(
        to bottom,
        #f4e4bc,
        #e6d5b1
    );
    z-index: 1;
`

const waveAnimation = keyframes`
    0% {
        transform: translateX(0) scaleY(1);
    }
    50% {
        transform: translateX(-25%) scaleY(0.8);
    }
    100% {
        transform: translateX(-50%) scaleY(1);
    }
`;

export const BeachSea = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 420px;
    z-index: 2000;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: -100px;
        left: -100%;
        width: 400%;
        height: 520px;
        background: linear-gradient(
            to bottom,
            rgba(55, 215, 255, 0.8),
            rgba(55, 215, 255, 0.3),
            rgba(55, 215, 255, 0.8) 66%,
            rgba(55, 215, 255, 0.9)
        );
        border-radius: 50% 50% 0 0;
        animation: ${waveAnimation} 8s infinite linear;
        transform-origin: center bottom;
    }
`

export const Horse = styled.div`
    position: absolute;
    width: 100px;
    height: 100px;
    will-change: transform;
    z-index: 1000;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`

export const IssuesFieldContainer = styled.div<{ scale: number }>`
    position: absolute;
    top: 500px;
    left: 1600px;
    max-height: 80vh;
    overflow: auto;
    transform: ${props => `scale(${1 / props.scale})`};
    transform-origin: top left;
`

export const PathLabel = styled.div<{
    left: number;
    top: number;
    width: number;
    height: number;
}>`
    position: absolute;
    color: rgba(0, 0, 0, 0.5);
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    left: ${props => props.left}px;
    top: ${props => props.top}px;
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    pointer-events: none;
`

export const Message = styled.div<{
    left: number;
    top: number;
    width: number;
    opacity: number;
}>`
    position: absolute;
    transition: opacity 0.5s;
    border: 1px solid #CCC;
    opacity: ${props => props.opacity};
    z-index: 10;
    line-height: 22px;
    border-radius: 5px;
    text-align: center;
    padding: 12px;
    background-color: #FFF;
    left: ${props => props.left}px;
    top: ${props => props.top}px;
    width: ${props => props.width}px;
`
