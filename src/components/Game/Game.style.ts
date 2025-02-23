import styled from 'styled-components'
import { WORLD_WIDTH, WORLD_HEIGHT } from '../../utils/coordinates'
import { Z_LAYERS } from '../../config/zIndex'

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
    z-index: ${Z_LAYERS.CHARACTERS};
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
    z-index: ${Z_LAYERS.UI};
    line-height: 22px;
    border-radius: 5px;
    text-align: center;
    padding: 12px;
    background-color: #FFF;
`

export const Sand = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 800px;
    z-index: ${Z_LAYERS.SAND};
    background: linear-gradient(
        to bottom,
        #f4e4bc,
        #e6d5b1
    );
`;

export const Sea = styled.div`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 420px;
    z-index: ${Z_LAYERS.WATER};
    overflow: hidden;
    transform: translateZ(0);
`;

export const Wave = styled.div`
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
    transform-origin: center bottom;
    backface-visibility: hidden;
`;

export const Leaderboard = styled.div`
    position: absolute;
    background-color: #FFF;
    border: 1px solid #CCC;
    border-radius: 5px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-items: center;
    > b {
        display: block;
        margin-bottom: 12px;
        font-weight: bold;
    }
    > div {
        width: 100%;
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 24px;
        > span {
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
`
