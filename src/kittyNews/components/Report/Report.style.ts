import styled from 'styled-components'
import { breaks, colors, grey, gutters, fontSize } from 'kittyNews/style/config'

export const Control = styled.section`
    box-sizing: border-box;
    padding: ${gutters['md']};
    width: 100%;
    margin: 0 0 ${gutters['md']};
    border-radius: ${gutters['sm']};
    border: 1px solid #EEE;
    z-index: 100;
    > div.mobile {
        position: relative;
        width: 100%;
        @media (min-width: ${breaks['md']}) {
            display: none;
        }
    }
   
    > h2 {
        width: 100%;
        text-align: center;
        margin-bottom: ${gutters['md']};
        font-size: ${fontSize['md']};
        > span {
            display: none;
            @media (min-width: ${breaks['md']}) {
                display: inline-block;
            }
        }
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['lg']};
            margin-bottom: ${gutters['lg']};
            
        }
    }
    background-color: rgba(255,255,255,0.75);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .horizontal-slider {
        width: 100%;
        display: none;
        height: 10px; // Customize the track height
        background: #ddd; // Track color
        border-radius: 5px; // Rounded track corners
        margin: 0; 
        position: relative;
        @media (min-width: ${breaks['md']}) {
            display: block;
        }
    }

    .example-track {
        background: ${colors.bubblegum};
        border-radius: 5px;
    }

    .example-thumb {
        width: 14px;
        height: 14px;
        background-color: #fff;
        border: 2px solid ${colors.bubblegum};
        border-radius: 50%; 
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: background-color 0.1s, transform 0.1s ease;
        margin-top: -4.5px;
        &:hover {
            background-color: ${colors.bubblegum};
            transform: scale(1.2);
        }
    }
`

export const Div = styled.div`
    width: 100%;
    font-weight: bold;
    color: #444;
    box-sizing: border-box;
    > input {
        width: 100%;
    }
    > div {
        padding-top: ${gutters['md']};
        &.bg-grey {
            background-color: #F6F6F6;
        }
        &:first-of-type {
            border-top: 2px dotted rgba(0,0,0,0.25);
        }
        &:last-of-type {
            border-bottom: 2px dotted rgba(0,0,0,0.25);
        }
        background-color: #EEE;
        display: flex;
        align-item: center;
        justify-content: center;
        flex-wrap: wrap;
        font-size: 12px;
        @media (min-width: ${breaks['lg']}) {
            font-size: 14px;
        }
        > div {
            font-family: bungee, sans-serif;
            font-weight: 400;
            letter-spacing: 0.5px;
            color: ${grey[600]};
            > span {
                color: ${grey[900]};
            }
        }
        > * {
            margin: 0 ${gutters['md']} ${gutters['md']};
        }
        > div.graphKey {
            display: flex;
            align-items: center;
            > label {
                font-size: 0.75vw;
                margin-right: ${gutters['xs']};
            }
        }
        &:last-of-type {
            margin-bottom: ${gutters['xlg']};
        }
    }
`

export const ChartContainer = styled.section`
    width: 100%;
    position: relative;
    box-sizing: border-box;
    height: 0; 
    padding-bottom: 40%;
    background-color: #EEE;
    border-radius: ${gutters['xs']};
    font-size: 0.5vw;
    background-image: url('/images/icons/normal_gs.svg');
    background-repeat: no-repeat;
    background-position: center;
    display: none;
    @media (min-width: ${breaks['md']}) {
        display: block;
    }
`;

export const ChartWrapper = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
`;