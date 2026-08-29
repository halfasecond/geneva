import styled from 'styled-components'
import { breaks, colors, fontSize, grey, gutters } from 'kittyNews/style/config'

export const Div = styled.div`
    background-color: ${grey[100]};
    border: 1px solid ${grey[200]};
    padding: ${gutters['lg']} 2% 0;
    box-sizing: border-box;
    display: flex;
    width: 100%;
    justify-content: space-evenly;
    flex-wrap: wrap;
    text-align: center;
    font-weight: bold;
    font-size: ${fontSize['xs']};
    border-radius: ${gutters['sm']};
    > div {
        width: 25%;
        @media (min-width: ${breaks['md']}) {
            width: 12.5%;
        }
        @media (min-width: ${breaks['xlg']}) {
            width: 6%;
        }
        margin-bottom: ${gutters['lg']};
        color: ${grey[700]};
        > a {
            font-size: ${fontSize['xsm']};
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