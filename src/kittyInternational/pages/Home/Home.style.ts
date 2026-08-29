import styled from 'styled-components'
import { breaks, gutters } from 'kittyInternational/style/config'

export const Div = styled.div`
    display: flex;
    justify-content: space-evenly;
    flex-direction: column;
    h3 {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    > h2 {
        font-family: "funkydori", sans-serif;
        font-size: 32px;
        margin: ${gutters['xl']} 2.5% ${gutters['lg']};
        @media (min-width: ${breaks['md']}) {
            font-size: 48px;
        }
    }
    > img {
        width: 300px;
        margin: ${gutters['xl']} auto;
    }
    > p {
        > a {
            border-bottom: 1px dotted #666;
            &:hover {
                text-decoration: none;
                border-bottom: 1px dotted #333;
            }
        }
    }
`

export const Grid = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex-wrap: wrap;
    margin-bottom: ${gutters['lg']};
`

export const Container = styled.div`
    width: 100%;
    text-align: left;
    margin: 0 1%;
    > div {
        &:first-of-type {
            margin-bottom: ${gutters['sm']};
        }
    }
    
    @media (min-width: ${breaks['md']}) {
        width: 48%;
    }
    @media (min-width: ${breaks['xl']}) {
        width: 18%;
    }
`
