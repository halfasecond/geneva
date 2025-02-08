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
    top: 500px;  // Align with pond's top
    left: 1600px;  // Position to the right of pond (1040 + 500 + spacing)
    max-height: 80vh;
    overflow: auto;
    transform: ${props => `scale(${1 / props.scale})`}; // Counter parent scale
    transform-origin: top left;
`

export const GameSpace = styled.div`
    position: absolute;
    width: 5000px;
    height: 8000px;
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

export const Minimap = styled.div`
    position: fixed;
    bottom: 100px;
    right: 34px;
    width: 250px;
    height: 200px;
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    overflow: hidden;
`

export const MinimapHorse = styled.div<{ x: number; y: number }>`
    position: absolute;
    width: 4px;
    height: 4px;
    background: red;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    left: ${props => (props.x / 5000) * 200}px;
    top: ${props => (props.y / 5000) * 200}px;
`

export const MinimapPath = styled.div<{ 
    left: number;
    top: number;
    width: number;
    height: number;
}>`
    position: absolute;
    background: rgba(238, 238, 238, 0.5);
    left: ${props => (props.left / 5000) * 200}px;
    top: ${props => (props.top / 5000) * 200}px;
    width: ${props => (props.width / 5000) * 200}px;
    height: ${props => (props.height / 5000) * 200}px;
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

export const ViewportIndicator = styled.div<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    scale: number;
}>`
    position: absolute;
    border: 1px solid rgba(0, 0, 0, 0.3);
    background: rgba(255, 255, 255, 0.1);
    left: ${props => (props.x / 5000) * 200}px;
    top: ${props => (props.y / 5000) * 200}px;
    width: ${props => Math.min(200, (props.width / (5000 * props.scale)) * 200)}px;
    height: ${props => Math.min(200, (props.height / (5000 * props.scale)) * 200)}px;
    transition: all 0.1s ease-out;
`
