// @ts-nocheck
import styled from 'styled-components'

export const Container = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: #f0f0f0;
`

export const GameSpace = styled.div`
    position: absolute;
    width: 5000px;
    height: 8000px;
    background: white;
    transition: transform 0.1s ease-out;
    will-change: transform;
`

export const Horse = styled.div`
    position: absolute;
    width: 100px;
    height: 100px;
    will-change: transform;
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
