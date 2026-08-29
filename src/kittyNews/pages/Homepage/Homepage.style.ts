import styled from 'styled-components'
import * as Styled from 'kittyNews/style'
import { breaks, gutters } from 'kittyNews/style/config'

export const Section = styled(Styled.Section)`
    margin-bottom: ${gutters['xxl']};
    &:first-of-type {
        margin-bottom: ${gutters['xl']};
    }
    display: flex;
    flex-direction: column;
    > h2 {
        margin-bottom: ${gutters['lg']};
    }
`

export const Section_2Column = styled(Section)`
    align-items: center;
    @media (min-width: ${breaks['lg']}) {
        flex-direction: row;
        align-items: flex-start;
    }
    > div {
        &:last-of-type {
            align-items: center;
            @media (min-width: 360px) {
                min-width: 360px;
            }
        }
        &:first-of-type {
            flex-grow: 1;
            margin: 0 0 ${gutters['xl']} 0;
            @media (min-width: ${breaks['lg']}) {
                margin: 0 ${gutters['xxl']} 0 0;
            }
        } 
    }
`