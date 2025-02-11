import styled from 'styled-components'

export const Container = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: rgb(170, 255, 207);
    z-index: 0;
`

export const IssuesFieldContainer = styled.div<{ scale: number }>`
    position: absolute;
    top: 500px;
    left: 1600px;
    max-height: 80vh;
    overflow: auto;
    transform: ${props => `scale(${1 / props.scale})`}; // Counter parent scale
    transform-origin: top left;
`

export const GameSpace = styled.div`
    position: absolute;
    width: 5000px;
    height: 5000px;
    transition: transform 0.1s ease-out;
    will-change: transform;
`

export const Horse = styled.div`
    position: absolute;
    width: 100px;
    height: 100px;
    will-change: transform;

    z-index: 2;
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
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

