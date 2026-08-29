import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from './config'

export const Main = styled.main`
    width: 100%;
    min-width: 320px;
    max-width: 1250px;
    margin: 0 auto;
`

export const Div = styled.div`
    width: 90%;
    @media (min-width: ${breaks['md']}) {
        width: 94%;
    }
    margin: 0 auto;
    max-width: 1292px;
    min-height: 60vh;
    > h1 {
        margin: ${gutters['lg']} 0 ${gutters['lg']} 0;
        > span, > a > span {
            color: #FF0066;
        }
        + p {
            font-size: ${fontSize['md']};
            margin-bottom: ${gutters['lg']};
            font-weight: 600;
            @media (min-width: ${breaks['md']}) {
                font-size: ${fontSize['xmd']};
                margin-bottom: ${gutters['xl']};
                line-height: 28px;
            }
            @media (min-width: ${breaks['xlg']}) {
                font-size: ${fontSize['lg']};
                font-weight: 500;
            }
        }
    }
    > h2 {
        padding-top: ${gutters['md']};
        margin-bottom: 0;
    }
    > p {
        margin-bottom: ${gutters['md']};
        > a {
            color: #555;
            border-bottom: 1px dotted #333;
        }
    }
    > ul > li {
        > a {
            color: #555;
            border-bottom: 1px dotted #333;
        } 
    }
    &:last-child {
        margin-bottom: ${gutters['xxxl']};
        clear: both;
    }
    
`

export const Section = styled.section`
    box-sizing: border-box;
    margin: 0 auto ${gutters['lg']};
    width: 96%;
    > h2 {
        width: 100%;
        text-align: center;
        font-size: ${fontSize['xmd']};
        color: ${grey[800]};
        @media (min-width: ${breaks['xlg']}) {
            font-size: ${fontSize['lg']};
        }
    }
    > p {
        margin-bottom: ${gutters['xxl']};
    }
`

export const Grid = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
`