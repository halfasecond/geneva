import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    .loading {
        width: 50%;
        aspect-ratio: 1/1;
        max-width: 200px;
        margin-top: ${gutters['xl']};
    }
    &.kitty-pfp {
        > p {
            font-size: 10px;
            line-height: 12px;
            font-weight: bold;
            margin-bottom: ${gutters['xxs']};
        }
        > .pfp-art {
            position: relative;
            width: 80%;
            margin-bottom: ${gutters['sm']};
            > .pfp-circle {
                position: relative;
                aspect-ratio: 1/1;
                width: 100%;
                overflow: hidden;
                border-radius: 100%;
                box-shadow: rgba(0,0,0,0.2) 0 0 6px;
                > img {
                    position: absolute;
                    width: 160%;
                    margin-left: -27%;
                    margin-top: -14%;
                    cursor: pointer;
                }
            }
            > .family-jewels {
                position: absolute;
                right: -2px;
                bottom: 0;
                z-index: 2;
            }
        } 
    }

    &.kitty-info {
        width: 100%;
        > div {
            &.kitty-image {
                max-width: 380px;
            }
            > h3 {
                text-align: center;
                margin-bottom: ${gutters['sm']};
            }
        }
        > h2 {
            font-size: ${fontSize['lg']};
            margin-bottom: ${gutters['sm']}; 
        }
        > h3 {
            font-size: ${fontSize['md']};
            margin-bottom: ${gutters['sm']};
            font-family: bungee, sans-serif;
            font-weight: 400;
        }
        > p {
            text-transform: uppercase;
            font-family: bungee, sans-serif;
            font-weight: 400;
            &:last-of-type {
                margin-bottom: ${gutters['lg']}; 
            }
        }
        > code {
            background-color: #EEE;
            width: 100%;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: ${gutters['md']};
            border-radius: 4px;
            margin-bottom: ${gutters['lg']};
            white-space: pre-wrap;
            word-break: break-all;
            box-sizing: border-box;
        }
    }
`

export const AwardContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
`

export const Badge = styled.div`
    padding: ${gutters['sm']} ${gutters['md']};
    margin: ${gutters['md']} ${gutters['sm']} ${gutters['lg']} 0;
    &:last-of-type {
        margin: ${gutters['md']} 0 ${gutters['lg']};
    }
    display: flex;
    align-items: center;
    border: 1px solid ${grey[400]};
    background-color: #FFF;
    border-radius: 4px;
    > div {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        > img {
            width: 26px;
            height: 26px;
            margin-right: ${gutters['sm']};
            @media (min-width: ${breaks['md']}) {
                width: 42px;
                height: 42px;
                margin-right: ${gutters['md']};
            }
            
        }
        > p {
            font-family: bungee, sans-serif;
            font-weight: 400;
        }
        > span {
            display: block;
            font-size: ${fontSize['xs']};
        } 
    }
`

export const ImageContainer = styled.div`
    width: 100%;
    aspect-ratio: 1/1;
    position: relative;
    border-radius: ${gutters['xs']};
    &.shadow {
        &:before {
            position: absolute;
            top: 73%;
            left: -2%;
            right: 0;
            width: 55%;
            height: 6.2%;
            margin: auto;
            background-color: rgba(0,0,0,0.2);
            border-radius: 50%;
            content: "";
            z-index: 0;
        }
    }
    &.tinybox {
        &:before {
            top: 79.25%;
        }
    }
    > img {
        width: 100%;
        z-index: 1;
        position: relative;
    }
`

export const Event = styled.div`
    width: 100%;
    background-color: #FFF;
    padding-top: ${gutters['md']};
    @media (min-width: ${breaks['md']}) {
        padding-top: ${gutters['lg']};
    }
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: ${fontSize['sm']};
    > h3 {
        text-transform: uppercase;
        font-family: bungee, sans-serif;
        font-weight: 400;
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
    }
    > div {
        width: 100%;
        text-align: center;
        &.birth {
            margin-bottom: ${gutters['lg']};
        }
    }
    &.first {
        border-radius: 4px 4px 0 0;
    }
    &.last {
        border-radius: 0 0 4px 4px;
        &.first {
            border-radius: 4px;
        }
    }
`