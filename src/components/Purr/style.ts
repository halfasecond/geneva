import styled from 'styled-components'
import { breaks, fontSize, grey, gutters, headingSize } from 'style/config'

export const MetamaskContainer = styled.div`
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
`

export const Section = styled.main.withConfig({
    shouldForwardProp: (prop) => !['offset', 'backgroundColor', 'zIndex', 'minHeight', 'justifyContent', 'alignItems'].includes(prop),
})<{
    offset: number;
    backgroundColor?: string;
    zIndex?: number;
    minHeight?: string;
    justifyContent?: string;
    alignItems?: string;
    color?: string;
}>`
    position: absolute;
    top: ${props => props.offset}px;
    width: 100%;
    min-height: ${props => props.minHeight || '100vh'};
    background-color: ${props => props.backgroundColor || 'transparent'};
    z-index: ${props => props.zIndex || 1};
    display: flex;
    flex-direction: column;
    justify-content: ${props => props.justifyContent || 'center'};
    align-items: ${props => props.alignItems || 'center'};
    color: ${props => props.color || '#FFF'};
    margin: 0 auto;

    p {
        line-height: 32px;
        > b {
            font-weight: bold;
        }
        > a {
            display: inline-block;
            border-bottom: 2px dotted #CCC;
        }
    }
`

// Hero Section Styles
export const HeroSection = styled(Section)`
    > div.claim {
        padding: ${gutters['xlg']} ${gutters['md']};
        @media (min-width: ${breaks['md']}) {
            padding: ${gutters['xlg']} ${gutters['xxl']};
        }

        border-radius: ${gutters['sm']};
        background-color: rgba(0,0,0,0.7);
        text-align: center;
        border: 4px solid #000;
        box-shadow: 0 0 24px ${grey[900]};
        position: absolute;
        margin-top: 400px;
        
        > h2 {
            font-size: ${fontSize['sm']};
            @media (min-width: ${breaks['md']}) {
                font-size: ${fontSize['md']};
            }
            margin-bottom: ${gutters['lg']};
            display: flex;
            align-items: center;
            justify-content: center;
            
            > div {
                width: 28px;
                height: 28px;
                &:first-of-type {
                    margin-right: ${gutters['md']};
                }
                &:last-of-type {
                    margin-left: ${gutters['md']};
                }
            }
        }

        > * {
            margin-bottom: ${gutters['md']};
            &:last-child {
                margin-bottom: 0;
            }
            > a {
                &:first-of-type {
                    display: none;
                    @media (min-width: ${breaks['md']}) {
                        display: inline-block;
                    }
                }
                &.mobile {
                    @media (min-width: ${breaks['md']}) {
                        display: none;
                    }
                }
            }
        }

        > p {
            margin-bottom: ${gutters['xlg']};
        }

        a {
            border-bottom: 2px dotted #CCC;
        }
    }
`

// Video Section Styles
export const VideoSection = styled(Section)`
    > h3 {
        margin-top: ${gutters['xxl']};
        font-size: 36px;
        font-family: funkydori, sans-serif;
        text-shadow: 2px 2px 3px rgba(255,255,255,0.5);
        color: #333;
    }
`

// Content Section Styles
export const ContentSection = styled(Section)`
    padding: ${gutters['xl']} 0;
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
        > b {
            font-weight: bold;
        }
    }
`

// Video with Text Section
export const VideoTextSection = styled(Section)`
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    padding: 0;
    gap: 0;
    
    > div:last-child {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        width: 90%;
        background-color: rgba(255,255,255,0.06);
        box-sizing: border-box;
        padding: ${gutters['xl']} ${gutters['md']};
        margin-top: 0;
        @media (min-width: ${breaks['md']}) {
            padding: ${gutters['xl']};
            width: 54%;
            margin-left: auto;
            margin-right: 5%;
        }
        
        > h2 {
            font-size: ${fontSize['xl']};
            margin-bottom: ${gutters['lg']};
        }
        
        > p {
            margin-bottom: ${gutters['lg']};
            > b {
                font-weight: bold;
            }
            a {
                border-bottom: 2px dotted #CCC;
            }
        }
    }
`

// White Paper Section
export const WhitePaperSection = styled(Section)`
    justify-content: center;
    padding: ${gutters['xl']} 0;
    > h2 {
        font-size: ${fontSize['xl']};
        margin-top: ${gutters['xl']};
        margin-bottom: ${gutters['xl']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${headingSize['lg']};
        }
    }

    > p {
        margin: 0 ${gutters['md']} ${gutters['lg']};
        @media (min-width: ${breaks['md']}) {
            margin: 0 ${gutters['xxl']} ${gutters['lg']};
        }
        > a {
            > b {
                font-weight: bold;
            }
        }
    }
    
    min-height: auto;
    @media (min-width: ${breaks['md']}) {
        min-height: 100vh;
        overflow: auto;
    }

    > img {
        width: 300px;
        align-self: end;
        margin: ${gutters['xxl']} auto 0;
        @media (min-width: ${breaks['md']}) {
            margin: ${gutters['xxl']} 200px 0 0;
        }
    }
`

// Claim Section
export const ClaimSection = styled(Section)`
    justify-content: center;
    padding: ${gutters['xl']} 0;
    > h2 {
        color: #FFF;
        margin-bottom: ${gutters['xxl']};
    }

    > * {
        z-index: 2;
    }
`

// Explore Section
export const ExploreSection = styled(Section)`
    padding: ${gutters['xl']} 0;
    > h2 {
        color: #000;
        font-size: ${fontSize['xl']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${headingSize['lg']};
        }
    }
    
    min-height: auto;
    @media (min-width: ${breaks['md']}) {
        min-height: 100vh;
    }
`

// Final Section
export const FinalSection = styled(Section)`
    > h4 {
        position: absolute;
        bottom: ${gutters['xl']};
        text-align: center;
        text-shadow: 2px 2px 3px rgba(255,255,255,0.5);
        font-size: ${fontSize['sm']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
    }
`

// Video Container for mute button
export const VideoContainer = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
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
    max-width: 100%;
    display: block;
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

export const MuteButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 12px;
    cursor: pointer;
    z-index: 10;
    transition: background 0.2s ease;
    
    &:hover {
        background: rgba(0, 0, 0, 0.7);
    }
`;