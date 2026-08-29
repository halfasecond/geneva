import { breaks, gutters, grey, fontSize } from 'kittyNews/style/config'
import styled from 'styled-components'

export const Div = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 2.5% ${gutters['lg']};
    padding-top: ${gutters['lg']};
    > h1 {
        margin-bottom: ${gutters['xxs']};
        font-size: ${fontSize['lg']};
        @media (min-width: ${breaks['lg']}) {
            font-size: ${fontSize['xxl']};
        }
    }

    > a > img {
        width: 80px;
        @media (min-width: ${breaks['lg']}) {
            width: 110px;
        }
    }

    > h2 {
        margin-bottom: ${gutters['md']};
        color: ${grey[800]};
        &:first-of-type {
            margin-bottom: ${gutters['xlg']};
        }
        font-size: ${fontSize['xs']};
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xmd']};
        }
    }

    > p {
        font-weight: bold;
        display: flex;
        margin: 0 0 ${gutters['xlg']};
        background-color: ${grey[100]};
        border: 1px solid ${grey[200]};
        padding: ${gutters['sm']} ${gutters['md']};
        border-radius: ${gutters['xs']};
        font-size: ${fontSize['xs']};
        @media (min-width: ${breaks['sm']}) {
            margin: 0 0 ${gutters['xlg']};
        }
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['md']};
        }
        > span {
            font-size: ${fontSize['xsm']};
            display: none;
            @media (min-width: ${breaks['xs']}) {
                display: inline-block;
                 &:first-of-type {
                    margin-right: ${gutters['md']};
                } 
                &:last-of-type {
                    margin-left: ${gutters['xmd']};
                } 
            }
        }
    }

`