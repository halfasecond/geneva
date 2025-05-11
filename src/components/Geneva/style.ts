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
export const VideoBackground = styled.video`
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
        > div {
            aspect-ratio: 16 / 11;
            margin-bottom: ${gutters['xl']};
            background-size: auto 100%;
            background-position: center;
            border-radius: 2.5px;
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
    &.grid {
        > div {
            @media (min-width: ${breaks['md']}) {
                width: 30%;
            }
        }
    }
`