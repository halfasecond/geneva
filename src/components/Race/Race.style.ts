import styled from 'styled-components'

export const RaceTrack = styled.div`
    position: absolute;
    left: 700px;
    top: 1770px;  // 1500 + 270
    width: 1250px;
    height: 400px;
    background-color: transparent;
    z-index: 1;
`

export const StartLine = styled.div`
    position: absolute;
    left: 700px;
    top: 1770px;  // 1500 + 270
    width: 10px;
    height: 420px;
    background-color: #888;
    z-index: 1;
`

export const FinishLine = styled.div`
    position: absolute;
    left: 1990px;
    top: 1770px;  // 1500 + 270
    width: 10px;
    height: 420px;
    background-color: #888;
    z-index: 1;
`

export const StartingStall = styled.div`
    position: absolute;
    width: 120px;
    height: 100px;  // Reduced height by 20px
    background-color: #cccccc;  // Solid color without opacity
    border: 1px solid #CCC;  // Added border for better visibility
    z-index: 1;
`

export const CountdownDisplay = styled.div`
    position: absolute;  // Changed to absolute to position relative to race track
    left: 800px;        // Position near start line
    top: 1930px;        // Vertically centered in race area
    width: 80px;
    height: 80px;
    background-color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;    // Increased size for better visibility
    font-weight: bold;
    z-index: 2;
    border-radius: 8px;  // Rounded corners
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);  // Add shadow for depth
`

export const Podium = styled.div`
    position: absolute;
    left: 1880px;
    top: 1650px;  // 1380 + 270
    width: 260px;
    height: 80px;
    background-color: #FFF;
    border: 1px solid #CCC;
    border-radius: 5px;
    opacity: 0;
    transition: opacity 0.5s;
    z-index: 10;
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
    position: fixed;  // Fixed position relative to viewport
    right: 20px;
    top: 20px;
    width: 380px;
    height: 120px;
    z-index: 1;
`

export const Fence = styled.div`
    position: absolute;
    left: 700px;
    width: 1300px;
    height: 40px;
    background-size: auto 200%;
    z-index: 0;

    &.top {
        top: 1739px;  // 1469 + 270
    }

    &.bottom {
        top: 2150px;  // 1880 + 270
    }
`