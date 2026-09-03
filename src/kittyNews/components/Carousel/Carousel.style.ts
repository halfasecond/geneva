import { breaks, grey, gutters } from 'kittyNews/style/config'
import styled from 'styled-components'

export const Div = styled.div`
    width: 100%;
    min-width: 0;
    a > div:first-of-type {
        width: 100%;
        aspect-ratio: 16/9;
        border-radius: 4px;
        border: 2px solid ${grey['400']};
        margin-bottom: ${gutters['xmd']};
        background-size: cover;
        background-position: center;
    }
    h2 {
        overflow-wrap: anywhere;
        word-break: break-word;
    }
    .slick-slider {
        .slick-slide {
            > div {
                padding: 0 ${gutters['sm']};
                margin-bottom: ${gutters['lg']};
                box-sizing: border-box;
            }
        }
    }
`

export const MobileTrack = styled.div`
    display: flex;
    gap: ${gutters['md']};
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 8%;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
    padding: 0 8% ${gutters['lg']};
    scrollbar-width: none;
    &::-webkit-scrollbar {
        display: none;
    }
    > a {
        flex: 0 0 84%;
        max-width: 84%;
        scroll-snap-align: center;
        box-sizing: border-box;
    }
    @media (min-width: ${breaks['md']}) {
        display: none;
    }
`

export const DesktopTrack = styled.div`
    display: none;
    @media (min-width: ${breaks['md']}) {
        display: block;
    }
`
