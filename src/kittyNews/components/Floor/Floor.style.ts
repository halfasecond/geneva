import styled from 'styled-components'
import { breaks, colors, fontSize, grey, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    background-color: ${grey[100]};
    margin: ${gutters['sm']} 0 ${gutters['xlg']};
    padding: ${gutters['xlg']} 5% 0;
    box-sizing: border-box;
    border-radius: ${gutters['md']};
    border: 1px solid ${grey[200]};
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: space-between;
    text-align: center;
    font-weight: bold;

    padding: ${gutters['xlg']} 0 0;
    @media (min-width: ${breaks['sm']}) {
        padding: ${gutters['xlg']} 2.5% 0;
    }

    > div {
        width: 33%;
        font-size: ${fontSize['xs']};
        margin-bottom: ${gutters['xlg']};
        &:last-of-type {
            display: none;
        }
        @media (min-width: ${breaks['sm']}) {
            width: 25%;
            &:last-of-type {
                display: flex;
            }
        }
        @media (min-width: ${breaks['md']}) {
            font-size: ${fontSize['xsm']};
        }
        @media (min-width: ${breaks['lg']}) {
            margin-bottom: ${gutters['xl']};
            width: 12.5%;
        }
        
        color: ${grey[800]};
        display: flex;
        flex-direction: column;
        align-items: center;

        > img {
            width: 30px;
            margin-bottom: 16px;
        }

        > div {
            width: 30px;
            height: 30px;
            margin-bottom: 16px;
        }

        > h2 {
            font-size: ${fontSize['xxs']};
            @media (min-width: ${breaks['md']}) {
                font-size: ${fontSize['sm']};
            }
            margin-bottom: ${gutters['xs']};
            color: ${grey[800]};
        }

        > a {
            display: block;
            margin-top: 5px;
            color: ${grey[900]};
            &:hover {
                color: ${colors.bubblegum};
                text-decoration: underline;
            }
        } 
    }
`