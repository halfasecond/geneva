import styled from 'styled-components'
import { getAssetPath } from 'utils/assetPath';
import { Z_LAYERS } from 'src/config/zIndex';

export const RaceTrack = styled.div`
    position: absolute;
    left: 700px;
    top: 1770px;
    width: 1250px;
    height: 400px;
    background-color: transparent;
    z-index: ${Z_LAYERS.TERRAIN_FEATURES};
`

export const StartLine = styled.div`
    position: absolute;
    left: 700px;
    top: 1770px;
    width: 10px;
    height: 420px;
    background-color: #888;
    z-index: ${Z_LAYERS.TERRAIN_FEATURES + 1};
`

export const FinishLine = styled.div`
    position: absolute;
    left: 1990px;
    top: 1770px;  // 1500 + 270
    width: 10px;
    height: 420px;
    background-color: #888;
`

export const StartingStall = styled.div`
    position: absolute;
    width: 120px;
    height: 100px;
    background-color: #cccccc;
    border: 1px solid #CCC;
    z-index: ${Z_LAYERS.TERRAIN_FEATURES};
`

export const CountdownDisplay = styled.div`
    position: absolute;
    left: 800px;
    top: 1930px;
    width: 80px;
    height: 80px;
    background-color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: bold;
    z-index: 2;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`

export const Podium = styled.div`
    position: absolute;
    left: 1880px;
    top: 1650px;
    width: 260px;
    height: 80px;
    background-color: #F6F6F6;
    border: 1px solid #CCC;
    border-radius: 5px;
    opacity: 0;
    transition: opacity 0.5s;
    text-align: center;
`

export const PodiumPlatform = styled.div`
    position: absolute;
    bottom: 0;
    left: 30px;
    height: 10px;
    background-color: #333;

    &.first {
        width: 66px;
        bottom: 20px;
        left: 97px;
    }

    &.second {
        width: 133px;
        bottom: 10px;
    }

    &.third {
        width: 200px;
    }
`

export const LeaderBoard = styled.div`
    position: fixed;
    right: 20px;
    top: 20px;
    width: 380px;
    height: 120px;
`

export const Fence = styled.div`
    position: absolute;
    left: 700px;
    width: 1300px;
    height: 40px;
    background-image: url('${getAssetPath('fence.png')}');
    background-size: auto 200%;

    &.top {
        top: 1739px;
    }

    &.bottom {
        top: 2150px;
    }
`