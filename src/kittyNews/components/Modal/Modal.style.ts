import styled from 'styled-components'
import { breaks, fontSize, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    position: fixed;
    z-index: 10000000000;
    width: 100%;
    height: 100vh;
    background-color: rgba(0,0,0,0.5);
    top: 0;
    left: 0;
    padding: 2.5vh 2.5%;
    box-sizing: border-box;
    > div {
        width: 100%;
        height: 95vh;
        max-width: 780px;
        border-radius: 12px;
        box-sizing: border-box;
        margin: 0 auto;
        overflow: auto;
        position: relative;
        padding: 72px ${gutters['md']};
        @media (min-width: ${breaks['md']}) {
            padding: 72px ${gutters['xl']};
        }
    }
`

export const Span = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: ${gutters['xlg']};
    top: ${gutters['xlg']};
    font-size: ${fontSize['md']};
    font-weight: bold;
    border: 2px dotted;
    line-height: 0;
    width: 26px;
    height: 26px;
    cursor: pointer;
    background-color: #FFF;
    &:hover {
        opacity: 0.7;
    }
`