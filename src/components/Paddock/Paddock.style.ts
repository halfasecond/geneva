import styled from 'styled-components'
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

export const Horse = styled.div`
    position: absolute;
    width: 100px;
    height: 100px;
    will-change: transform;
    z-index: 1000;
    transform: translateZ(0);
    
    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }
`

export const IssuesFieldContainer = styled.div`
    position: absolute;
    top: 500px;
    left: 1600px;
    max-height: 80vh;
    overflow: auto;
    transform-origin: top left;
`

export const PathLabel = styled.div`
    position: absolute;
    color: rgba(0, 0, 0, 0.5);
    font-size: 24px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
`

export const Message = styled.div`
    position: absolute;
    transition: opacity 0.5s;
    border: 1px solid #CCC;
    z-index: 10;
    line-height: 22px;
    border-radius: 5px;
    text-align: center;
    padding: 12px;
    background-color: #FFF;
`
