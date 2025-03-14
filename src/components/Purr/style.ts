import styled from 'styled-components'
import { breaks, fontSize, gutters, headingSize } from 'style/config'

export const Main = styled.main`
    width: 100%;
    z-index: 1;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #FFF;
    min-height: 100%;
    position: absolute;
    height: 100vh;
    > h3 {
        margin-top: ${gutters['xxl']};
        font-size: 36px;
        font-family: funkydori, sans-serif;
        text-shadow: 2px 2px 3px rgba(255,255,255,0.5);
        color: #333;
    }
    &:nth-of-type(2) {
        background-color: #FFF;
        z-index: 2;
        margin-top: 100vh;
    }
    &:nth-of-type(3) {
        z-index: 5;
        margin-top: 200vh;
        height: 125vh;
        background-color: rgba(0,0,0,0.9);
        background-repeat: no-repeat;
        background-size: 100% auto;
        background-position: center top;
        h2 {
            font-size: 32px;
            margin-bottom: ${gutters['lg']};
            @media (min-width: ${breaks['md']}) {
                margin-bottom: ${gutters['xl']};
            }
            text-shadow: 2px 2px 3px rgba(255,255,255,0.4);
        }
        > p {
            max-width: 800px;
            margin: 0 5% ${gutters['md']};
            text-align: center;
        }
    }
    &:nth-of-type(4) {
        z-index: 5;
        margin-top: 325vh;
        background-color: #000;
        background-size: auto 100%;
        background-repeat: no-repeat;
        background-position: center top;
        justify-content: flex-start;
        align-items: flex-end;
        > div {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            align-items: flex-start;
            justify-content: center;
            width: 90%;
            margin-top: -120px;
            @media (min-width: ${breaks['md']}) {
                margin-top: -180px;
                width: 54%;
            }
            margin-right: 5%;
            > h2 {
                font-size: ${fontSize['xl']};
                margin-bottom: ${gutters['lg']};
            }
            > p {
                margin-bottom: ${gutters['lg']};
            }
        }
    }

    &:nth-of-type(5) {
        z-index: 5;
        margin-top: 425vh;
        background-color: #F6F6F6;
        background-size: auto 100%;
        background-repeat: no-repeat;
        background-position: center top;
        > h2 {
            color: #000;
            font-size: ${fontSize['xl']};
            @media (min-width: ${breaks['md']}) {
                font-size: ${headingSize['lg']};
            }
        }
        height: 250vh;
        @media (min-width: ${breaks['md']}) {
            height: 100vh;
        }
    }

    &:nth-of-type(6) {
        justify-content: flex-end;
        
        margin-top: 675vh;
        @media (min-width: ${breaks['md']}) {
            margin-top: 525vh;
        }
        > h2 {
            color: #FFF;
            margin-bottom: ${gutters['xxl']};
        }
    }

    p {
        line-height: 32px;
        > b {
            font-weight: bold;
        }
        > a {
            display: inline-block;
            border-bottom: 1px dotted #CCC;
        }
    }
`

export const Background = styled.div`
    width: 100%;
    height: 100vh;
    position: fixed;
    background-image: url('https://cdn.halfasecond.com/images/purr/bg.svg');
    background-attachment: fixed;
    background-size: 100% auto;
    background-color: rgba(0,0,0,0.95);
`

export const Furlin = styled.div`
    position: fixed;
    width: 100%;
    height: 100vh;
    background-image: url('https://img.cryptokitties.co/0x06012c8cf97bead5deae237070f9587f8e7a266d/124.png');
    background-size: auto 140%;
    background-repeat: no-repeat;
    background-position: center;
    left: 0;
    top: 0;
    opacity: 0.04;
    z-index: 0;
`

export const VideoBackground = styled.video`
    width: 100%;
    height: 50vh;
    object-fit: cover;
    margin-bottom: ${gutters['xl']};
    @media (min-width: ${breaks['md']}) {
        margin: 0 25%;
        width: 50%;
    }
`
export const VideoBackground2 = styled.video`
    width: 100%;
    height: auto;
    object-fit: contain;
`

export const Grid = styled.div`
    display: none;
    @media (min-width: ${breaks['md']}) {
        display: flex;
    }
    flex-wrap: wrap;
    width: 100%;
    height: 100vh;
    position: relative;
    z-index: 3;
    justify-content: space-around;
    position: absolute;
    z-index: 2;
    > * {
        display: block;
        width: 100%;
        margin: 5vh 0;
        justify-content: center;
        width: 50%;
        margin: 10vh 0;
        align-items: flex-end;
        &:nth-of-type(3), &:nth-of-type(4) {
            align-items: flex-start;
        }
        display: flex;
        color: #333;
        > h2 {
            font-size: 18px;
            text-shadow: 2px 2px 3px rgba(0,0,0,0.1);
        }
    }
`

export const ImageGrid = styled.div`
    display: flex;
    margin: ${gutters['lg']} 5%;
    @media (min-width: ${breaks['md']}) {
        margin: ${gutters['xl']} 5%;
    }
    > img {
        width: 60px;
        height: 60px;
        @media (min-width: ${breaks['md']}) {
            width: 80px;
            height: 80px;
        }
        border-radius: 100%;
        margin-right: ${gutters['lg']};
        &:last-of-type {
            margin-right: 0;
        }
    }
`

export const ImageGrid2 = styled.div`
    display: flex;
    margin: ${gutters['lg']} 5%;
    @media (min-width: ${breaks['md']}) {
        margin: ${gutters['xl']} 5%;
    }
    width: 90%;
    flex-wrap: wrap;
    justify-content: space-around;
    > div {
        width: 100%;
        margin-bottom: ${gutters['xl']};
        @media (min-width: ${breaks['md']}) {
            width: 30%;
        }
        > img {
            width: 100%;
            border-radius: 2px;
            box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            border: #CCC 1px solid;
            margin-bottom: ${gutters['md']};
        }
        > p {
            color: #333;
            font-size: 12px;
            line-height: 22px;
            &:first-of-type {
                margin-bottom: ${gutters['md']};
                > a {
                    font-weight: bold; 
                }
            }
        }
    }
`