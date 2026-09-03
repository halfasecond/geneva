import styled, { keyframes } from 'styled-components'
import { gutters } from 'kittyNews/style/config'

const spritesheet = 'https://cryptokitties.co/images/cattributes/mewtation-gems/diamond-lg-sprite.svg'

export const Div = styled.div`
    display: flex;
    justify-content: center;
    &.overlay {
        justify-content: flex-end;
        flex-wrap: wrap;
        max-width: 72%;
        pointer-events: none;
        > div {
            pointer-events: auto;
            width: 14px;
            margin: 0 0 0 2px;
            &:last-of-type {
                margin: 0 0 0 2px;
            }
            &:after {
                top: 16px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                white-space: nowrap;
            }
        }
    }
`

interface Props {
    trait: string;
}

export const Jewel = styled.div<Props>`
    width: 20px;
    position: relative;
    cursor: pointer;
    &:before {
        content: '';
        display: block;
        padding-top: 100%;
    }
    margin: ${gutters['md']} ${gutters['sm']} ${gutters['md']} 0;
    &:last-of-type {
        margin: ${gutters['md']} 0;
    }
    &.diamond {
        background-image: url('/images/icons/diamond.svg');
    }
    &.gilded {
        background-image: url('/images/icons/gilded.svg');
    }
    &.amethyst {
        background-image: url('/images/icons/amethyst.svg');
    }
    &.lapis {
        background-image: url('/images/icons/lapis.svg');
    }
    background-size: 100% auto;
    background-repeat: no-repeat;
    &:after {
        content: '${({ trait }) => trait}';
        opacity: 0;
        position: absolute;
        left: -50%;
        top: 30px;
        font-size: 12px;
        font-weight: normal;
        background-color: #FFF;
        padding: 4px 8px;
        z-index: 100;
        border-radius: 4px;
        font-family: bungee, sans-serif;
        font-weight: 400;
    }
    &:hover {
        &:after {
            opacity: 1;
        }
    }
`

export const Diamond = styled(Jewel)`
    background-image: url(${spritesheet});
    background-size: 900% 100%;
    background-position: center;
    background-repeat: repeat;
    width: 30px;
    animation: ${keyframes`
        0% { background-position: 0 0; }
        11.11% { background-position: 100% 0; }
        22.22% { background-position: 200% 0; }
        33.33% { background-position: 300% 0; }
        44.44% { background-position: 400% 0; }
        55.55% { background-position: 500% 0; }
        66.66% { background-position: 600% 0; }
        77.77% { background-position: 700% 0; }
        88.88% { background-position: 800% 0; }
        100% { background-position: 900% 0; }
    `} 3s steps(8) infinite;
`
