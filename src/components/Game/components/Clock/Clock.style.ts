import styled, { keyframes } from 'styled-components'
import { Z_LAYERS } from 'src/config/zIndex'

const bgColors = {
    grape: '#ffdfff',
    fog: '#dadee9',
    seafoam: '#aaffcf',
    starlight: '#dfefff',
    ice: '#bbe4ea',
    'ghost green': '#efefcf',
    chestnut: '#ddadaf',
    sand: '#ffefcf',
    banana: '#ffefbf',
    curd: '#fff9d0'
}

const flash = keyframes`
    0% {
        box-shadow: 0 0 0 0 ${bgColors.grape},
                    0 0 0 0 ${bgColors.seafoam};
    }
    25% {
        box-shadow: 0 0 20px 10px ${bgColors.starlight},
                    0 0 40px 20px ${bgColors.ice};
    }
    50% {
        box-shadow: 0 0 40px 20px ${bgColors.banana},
                    0 0 60px 30px ${bgColors['ghost green']};
    }
    75% {
        box-shadow: 0 0 20px 10px ${bgColors.chestnut},
                    0 0 40px 20px ${bgColors.sand};
    }
    100% {
        box-shadow: 0 0 0 0 ${bgColors.grape},
                    0 0 0 0 ${bgColors.seafoam};
    }
`

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`

const quickSpin = keyframes`
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(720deg);
    }
`

const vitalikFlash = keyframes`
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
    }
`

export const VitalikFlash = styled.div<{ show: boolean }>`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    z-index: ${Z_LAYERS['TERRAIN_FEATURES'] + 1};
    pointer-events: none;
    opacity: 0;
    display: ${props => props.show ? 'block' : 'none'};

    img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    &.flash {
        animation: ${vitalikFlash} 0.5s ease-out forwards;
    }
`

export const TimerEmoji = styled.span`
    display: inline-block;
    font-size: 48px;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;

    &.spin {
        animation: ${quickSpin} 0.5s ease-out;
    }
`

export const Div = styled.div`
    position: absolute;
    z-index: ${Z_LAYERS['TERRAIN_FEATURES']};
    background-color: #EEE;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    width: 200px;
    height: 140px;
    border-radius: 10px;
    animation: ${flash} 2s linear infinite;

    &::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border: 2px solid ${bgColors.starlight};
        border-radius: 15px;
        animation: ${spin} 3s linear infinite;
    }

    > p {
        text-align: center;
        font-weight: bold;
        position: relative;
        z-index: 1;
    }
`